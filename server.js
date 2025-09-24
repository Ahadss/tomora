//==API TOMORA - Pedro Staiger==\\
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
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
        userId: req.body.searchId
      },
      orderBy: {
        id: 'desc'
      }
    });
    res.status(200).json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao consultar lembretes' });
  }
});

//Retorna o lembrete mais próximo ao horário atual
app.post('/reminderNearest', async (req, res) => {
  try {
    //Extração e validação dos dados de entrada
    const userId = req.body.userId;
    const hour = req.body.hour;
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    if (!hour || !/^\d{2}:\d{2}$/.test(hour)) {
      return res.status(400).json({ error: 'hour deve estar no formato HH:mm' });
    }

    //Busca todos os lembretes do usuário
    const reminders = await prisma.reminder.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        hour: 'asc',
      },
    });

    //Verifica se há lembretes
    if (!reminders || reminders.length === 0) {
      return res.status(404).json({ error: 'Nenhum lembrete cadastrado' });
    }

    //Encontra o primeiro lembrete futuro (hour >= req.body.hour)
    const futureReminder = reminders.find(reminder => reminder.hour >= hour);

    //Se houver lembrete futuro, retorna o primeiro; caso contrário, retorna o primeiro disponível
    const nearestReminder = futureReminder || reminders[0];

    res.status(200).json(nearestReminder);
  } catch (error) {
    console.error('Erro ao consultar lembrete mais próximo:', error);
    res.status(500).json({ error: 'Falha ao consultar próximo lembrete!' });
  }
});

// Atualiza os lembretes (permite atualização parcial)
app.post('/remindersUpdate', async (req, res) => {
  try {
    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.dosage) data.dosage = req.body.dosage;
    if (req.body.desc) data.desc = req.body.desc;
    if (req.body.hour) data.hour = req.body.hour;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Pelo menos um campo deve ser fornecido' });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: req.body.id },
      data
    });

    res.status(200).json(updatedReminder);
  } catch (error) {
    console.error("Erro ao atualizar lembrete:", error);
    res.status(500).json({ error: "Falha ao atualizar lembrete" });
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
        name: req.body.name,
        hour: req.body.hour,
        taken: req.body.taken,
        createdAt: new Date(), // Adiciona timestamp
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
        id: 'desc'
      }
    });
    res.status(200).json(histories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao consultar histórico' });
  }
});

// ===== CONFIGURAÇÕES DO OAUTH =====
const OAUTH_CONFIG = {
  CLIENT_ID: process.env.ALEXA_CLIENT_ID || 'tomora-skill-client-2024',
  CLIENT_SECRET: process.env.ALEXA_CLIENT_SECRET || 'x9kPqW7mZ3tR8vY2nJ5bL6cF4hT1rQ8w',
  JWT_SECRET: process.env.JWT_SECRET || 's3cr3t_t0m0r4_2024',
  AUTH_CODE_TTL: 5 * 60 * 1000, // 5 minutos
  ACCESS_TOKEN_TTL: 30 * 24 * 60 * 60, // 30 dias
  REFRESH_TOKEN_TTL: 365 * 24 * 60 * 60 // 1 ano
};

// Armazenamento temporário (em produção use Redis)
const authCodes = new Map();
const refreshTokens = new Map();

// Função para gerar códigos aleatórios
const generateRandomCode = () => {
  return `code_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

// ===== PÁGINA DE LOGIN HTML =====
const loginPageHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Tomora Skill</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .login-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #667eea;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .logo p {
            color: #666;
            font-size: 14px;
        }
        .alexa-badge {
            background: #00CAFF;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            display: inline-block;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e4e8;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .error-message {
            background: #fee;
            color: #c33;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
        }
        .error-message.show {
            display: block;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .info {
            margin-top: 20px;
            padding: 15px;
            background: #f0f7ff;
            border-radius: 10px;
            font-size: 14px;
            color: #555;
        }
        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        button.loading .button-text {
            display: none;
        }
        button.loading .spinner {
            display: block;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>🎯 Tomora</h1>
            <p>Sistema de Gestão de Lembretes</p>
        </div>
        
        <div class="alexa-badge">
            🔊 Conectar com Alexa
        </div>
        
        <div class="error-message" id="errorMessage"></div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    placeholder="seu@email.com"
                    autocomplete="email"
                >
            </div>
            
            <div class="form-group">
                <label for="password">Senha</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required 
                    placeholder="••••••••"
                    autocomplete="current-password"
                >
            </div>
            
            <button type="submit" id="submitButton">
                <span class="button-text">Autorizar Conexão</span>
                <div class="spinner"></div>
            </button>
        </form>
        
        <div class="info">
            ℹ️ Você está autorizando a Alexa a acessar seus lembretes no sistema Tomora.
        </div>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const button = document.getElementById('submitButton');
            const errorDiv = document.getElementById('errorMessage');
            
            button.classList.add('loading');
            button.disabled = true;
            errorDiv.classList.remove('show');
            
            const formData = new FormData(e.target);
            const params = new URLSearchParams(window.location.search);
            
            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.get('email'),
                        password: formData.get('password'),
                        state: params.get('state'),
                        redirect_uri: params.get('redirect_uri'),
                        client_id: params.get('client_id')
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else {
                    throw new Error(data.error || 'Erro ao fazer login');
                }
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.add('show');
                button.classList.remove('loading');
                button.disabled = false;
            }
        });
    </script>
</body>
</html>
`;

// ===== ENDPOINTS DO OAUTH =====

// 1. Endpoint de autorização - Mostra página de login
app.get('/auth', (req, res) => {
  const { response_type, client_id, state, redirect_uri } = req.query;
  
  // Validação básica
  if (response_type !== 'code') {
    return res.status(400).send('response_type deve ser "code"');
  }
  
  if (client_id !== OAUTH_CONFIG.CLIENT_ID) {
    return res.status(400).send('client_id inválido');
  }
  
  if (!state || !redirect_uri) {
    return res.status(400).send('state e redirect_uri são obrigatórios');
  }
  
  // Retorna a página de login
  res.send(loginPageHTML);
});

// 2. Endpoint de login - Processa credenciais e gera código
app.post('/auth/login', async (req, res) => {
  const { email, password, state, redirect_uri, client_id } = req.body;
  
  try {
    // Valida client_id
    if (client_id !== OAUTH_CONFIG.CLIENT_ID) {
      return res.status(401).json({ error: 'Cliente não autorizado' });
    }
    
    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    // Verifica senha (comparação direta, sem bcrypt)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    // Gera código de autorização
    const code = generateRandomCode();
    
    // Armazena código com dados do usuário
    authCodes.set(code, {
      userId: user.id,
      email: user.email,
      clientId: client_id,
      redirectUri: redirect_uri,
      createdAt: Date.now(),
      expiresAt: Date.now() + OAUTH_CONFIG.AUTH_CODE_TTL
    });
    
    // Constrói URL de redirecionamento
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', code);
    redirectUrl.searchParams.append('state', state);
    
    res.json({ 
      success: true, 
      redirectUrl: redirectUrl.toString() 
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

// 3. Endpoint de token - Troca código por tokens
app.post('/token', async (req, res) => {
  const { grant_type, code, refresh_token, client_id, client_secret } = req.body;
  
  // Valida credenciais do cliente
  if (client_id !== OAUTH_CONFIG.CLIENT_ID || client_secret !== OAUTH_CONFIG.CLIENT_SECRET) {
    return res.status(401).json({ 
      error: 'invalid_client',
      error_description: 'Cliente não autorizado'
    });
  }
  
  try {
    let tokenData;
    
    if (grant_type === 'authorization_code') {
      // Troca código por token
      const authData = authCodes.get(code);
      
      if (!authData) {
        return res.status(400).json({ 
          error: 'invalid_grant',
          error_description: 'Código inválido ou expirado'
        });
      }
      
      if (authData.expiresAt < Date.now()) {
        authCodes.delete(code);
        return res.status(400).json({ 
          error: 'invalid_grant',
          error_description: 'Código expirado'
        });
      }
      
      // Remove código após uso
      authCodes.delete(code);
      
      tokenData = {
        userId: authData.userId,
        email: authData.email
      };
      
    } else if (grant_type === 'refresh_token') {
      // Renova token usando refresh token
      const refreshData = refreshTokens.get(refresh_token);
      
      if (!refreshData || refreshData.expiresAt < Date.now()) {
        return res.status(400).json({ 
          error: 'invalid_grant',
          error_description: 'Refresh token inválido ou expirado'
        });
      }
      
      tokenData = {
        userId: refreshData.userId,
        email: refreshData.email
      };
      
      // Remove refresh token antigo
      refreshTokens.delete(refresh_token);
      
    } else {
      return res.status(400).json({ 
        error: 'unsupported_grant_type',
        error_description: 'Tipo de grant não suportado'
      });
    }
    
    // Gera novo access token
    const accessToken = jwt.sign(
      { 
        userId: tokenData.userId,
        email: tokenData.email,
        type: 'access'
      },
      OAUTH_CONFIG.JWT_SECRET,
      { expiresIn: OAUTH_CONFIG.ACCESS_TOKEN_TTL }
    );
    
    // Gera novo refresh token
    const newRefreshToken = generateRandomCode();
    refreshTokens.set(newRefreshToken, {
      userId: tokenData.userId,
      email: tokenData.email,
      createdAt: Date.now(),
      expiresAt: Date.now() + (OAUTH_CONFIG.REFRESH_TOKEN_TTL * 1000)
    });
    
    // Resposta padrão OAuth 2.0
    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: OAUTH_CONFIG.ACCESS_TOKEN_TTL
    });
    
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    res.status(500).json({ 
      error: 'server_error',
      error_description: 'Erro ao processar solicitação'
    });
  }
});

// 4. Middleware para validar token em requisições da skill
export const validateAlexaToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, OAUTH_CONFIG.JWT_SECRET);
    
    // Busca usuário para garantir que ainda existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    // Adiciona dados do usuário à requisição
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ===== ENDPOINTS DA SKILL ALEXA =====

// Endpoint protegido para a skill buscar lembretes
app.get('/alexa/reminders', validateAlexaToken, async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { 
        userId: req.user.id,
        active: true
      },
      orderBy: { reminderTime: 'asc' },
      take: 10
    });
    
    res.json({
      userId: req.user.id,
      userName: req.user.name,
      reminders: reminders.map(r => ({
        id: r.id,
        title: r.title,
        time: r.reminderTime,
        recurring: r.recurring
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar lembretes:', error);
    res.status(500).json({ error: 'Erro ao buscar lembretes' });
  }
});

// Endpoint para criar lembrete via Alexa
app.post('/alexa/reminders', validateAlexaToken, async (req, res) => {
  try {
    const { title, time, recurring } = req.body;
    
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user.id,
        title,
        reminderTime: new Date(time),
        recurring: recurring || 'none',
        active: true,
        source: 'alexa'
      }
    });
    
    res.json({
      success: true,
      reminder: {
        id: reminder.id,
        title: reminder.title,
        time: reminder.reminderTime
      }
    });
  } catch (error) {
    console.error('Erro ao criar lembrete:', error);
    res.status(500).json({ error: 'Erro ao criar lembrete' });
  }
});

// ===== INFORMAÇÕES DE CONFIGURAÇÃO =====
app.get('/oauth/info', (req, res) => {
  res.json({
    message: 'OAuth 2.0 configurado para Alexa',
    endpoints: {
      authorization: `${req.protocol}://${req.get('host')}/auth`,
      token: `${req.protocol}://${req.get('host')}/token`
    },
    client_id: OAUTH_CONFIG.CLIENT_ID,
    note: 'Configure estes endpoints na Alexa Developer Console'
  });
});

// Exporta configuração para uso em outros módulos
export { OAUTH_CONFIG };
```

// Inicialização
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
