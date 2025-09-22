//==API TOMORA - Pedro Staiger==\\
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());
app.use(cors());

const prisma = new PrismaClient();

//==USUÁRIOS==\\
//Cria usuário
app.post('/usersCreate', async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        isMedicado: req.body.isMedicado,
        isAuxiliar: req.body.isAuxiliar,      
      }
    });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao criar usuário' });
  }
});

//Efetua o login
app.post('/usersLogin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email: email
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordMatch = password === user.password;
    
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

//Linka usuários
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
    res.status(500).json({ error: 'Falha ao linkar contas'});
  }
});

//==LEMBRETES==\\
//Cria lembrete
app.post('/remindersCreate', async (req, res) => {
  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.body.userId,
        name: req.body.name,
        dosage: req.body.dosage,
        desc: req.body.desc,
        hour: req.body.hour,
      }
    });
    res.status(201).json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

//Consulta lembretes de um usuário específico
app.post('/remindersSearch', async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId: req.body.userId
      }
    });
    res.status(200).json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao consultar lembretes' });
  }
});

// Retorna o lembrete mais próximo ao horário atual
app.post('/reminderNearest', async (req, res) => {
  try {
    // Extração e validação dos dados de entrada
    const userId = req.body.userId;
    const hour = req.body.hour;
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    if (!hour || !/^\d{2}:\d{2}$/.test(hour)) {
      return res.status(400).json({ error: 'hour deve estar no formato HH:mm' });
    }

    // Busca todos os lembretes do usuário
    const reminders = await prisma.reminder.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        hour: 'asc',
      },
    });

    // Verifica se há lembretes
    if (!reminders || reminders.length === 0) {
      return res.status(404).json({ error: 'Nenhum lembrete cadastrado' });
    }

    // Encontra o primeiro lembrete futuro (hour >= req.body.hour)
    const futureReminder = reminders.find(reminder => reminder.hour >= hour);

    // Se houver lembrete futuro, retorna o primeiro; caso contrário, retorna o primeiro disponível
    const nearestReminder = futureReminder || reminders[0];

    res.status(200).json(nearestReminder);
  } catch (error) {
    console.error('Erro ao consultar lembrete mais próximo:', error);
    res.status(500).json({ error: 'Falha ao consultar próximo lembrete!' });
  }
});

//Deletar lembretes
app.post('/remindersDelete', async (req, res) => {
  try {
    await prisma.reminder.delete({
      where: {
        id: req.body.id
      }
    });

    res.status(200).json({ message: "Lembrete excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir lembrete." });
  }
});

//==HISTÓRICO==\\
//Cria histórico
app.post('/historyCreate', async (req, res) => {
  try {
    const history = await prisma.history.create({
      data: {
        userId: req.body.userId,
        reminderId: req.body.reminderId,
        hour: req.body.hour,
        taken: req.body.taken,
      }
    });
    res.status(201).json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao criar histórico' });
  }
});

//Consulta histórico de um usuário específico
app.post('/historySearch', async (req, res) => {
  try {
    const histories = await prisma.history.findMany({
      where: {
        userId: req.body.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.status(200).json(histories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao consultar histórico' });
  }
});

// Inicialização
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});