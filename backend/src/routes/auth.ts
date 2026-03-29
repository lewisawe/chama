import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { phone, name, pin } = req.body;
    if (!phone || !name || !pin) return res.status(400).json({ error: 'Phone, name, and PIN are required' });
    if (!/^(07|01|2547|2541)\d{7,8}$/.test(phone.replace(/\s/g, ''))) return res.status(400).json({ error: 'Enter a valid Kenyan phone number' });
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) return res.status(400).json({ error: 'PIN must be 4–6 digits' });
    if (name.trim().length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });

    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: { phone: phone.replace(/\s/g, ''), name: name.trim(), pin: hashedPin },
      select: { id: true, phone: true, name: true },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.status(201).json({ user, token });
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Phone already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) return res.status(400).json({ error: 'Phone and PIN are required' });

    const user = await prisma.user.findUnique({ where: { phone: phone.replace(/\s/g, '') } });
    if (!user || !(await bcrypt.compare(pin, user.pin))) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.json({ user: { id: user.id, phone: user.phone, name: user.name }, token });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});
