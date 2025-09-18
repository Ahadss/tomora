import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());
app.use(cors());

const prisma = new PrismaClient();


// ==================== Usuários ====================

// Cria usuário
app.post('/usersCreate', async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        isMedicado: req.body.isMedicado,
        isAuxiliar: req.body.isAuxiliar
      }
    });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao criar usuário' });
  }
});

// Efetua login (GET com query params)
app.post('/usersLogin', async (req, res) => {
  try {
    const { email, password } = req.body; // agora usa query params

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findFirst({
      where: { email: email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordMatch = password === password;

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      isMedicado: user.isMedicado,
      isAuxiliar: user.isAuxiliar,
      linkedId: user.linkedId
    });
  } catch (error) {
    console.error("Erro ao fazer login: " + error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Atualiza link entre usuários
app.post('/usersLink', async (req, res) => {
  try {
    const { userId, linkedId } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { linkedId },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Erro ao linkar conta: " + error);
    res.status(500).json({ error: 'Falha ao linkar contas' });
  }
});


// ==================== Lembretes ====================

// Cria lembrete
app.post('/remindersCreate', async (req, res) => {
  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.body.userId,
        name: req.body.name,
        dosage: req.body.dosage,
        desc: req.body.desc,
        hour: req.body.hour,
        days: req.body.days
      }
    });
    res.status(201).json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Consulta lembretes de um usuário específico (GET com query param)
app.post('/remindersSearch', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId: userId }
    });

    res.status(200).json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Retorna o lembrete mais próximo ao horário atual
app.get('/reminderNearest', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    const nearestReminder = await prisma.reminder.findFirst({
      where: {
        userId: parseInt(userId),
        hour: { gte: currentTime }
      },
      orderBy: { hour: 'asc' },
      take: 1
    });

    if (!nearestReminder) {
      return res.status(404).json({ error: 'Nenhum lembrete cadastrado!' });
    }

    res.status(200).json(nearestReminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch nearest reminder' });
  }
});

// Deletar lembrete
app.delete('/remindersDelete', async (req, res) => {
  try {
    await prisma.reminder.delete({
      where: { id: req.body.id }
    });

    res.status(200).json({ message: "Lembrete excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir lembrete." });
  }
});


// ==================== Inicialização ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API rodando na porta ${PORT}`);
});
