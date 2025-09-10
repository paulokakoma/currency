// Carrega as variáveis de ambiente do ficheiro .env
require("dotenv").config();
const express = require("express");
const { Resend } = require("resend"); // Usaremos Resend para enviar emails
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Cria a aplicação Express
const app = express();
const port = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);
// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Verifica se as chaves do Supabase foram carregadas
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Erro: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY não estão definidas."
  );
  console.error(
    "Por favor, crie um ficheiro .env e adicione as suas chaves do Supabase."
  );
  process.exit(1); // Termina o processo se as chaves não existirem
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(express.static(path.join(__dirname, "public"))); // Serve os ficheiros estáticos da pasta 'public'
app.use(express.json()); // Permite que o Express leia o corpo de pedidos JSON

// Middleware para verificar se o utilizador é um administrador
const isAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Acesso não autorizado: Token em falta." });
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res
      .status(401)
      .json({ error: "Acesso não autorizado: Token inválido." });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Acesso proibido: Apenas administradores." });
  }

  next(); // Se for admin, continua para a rota
};

// Função para notificar administradores por e-mail
const notifyAdminsOnZeroCredits = async (userId) => {
  try {
    // 1. Obter o email do utilizador que ficou sem créditos
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      console.error(
        "Não foi possível obter o email do utilizador:",
        userError?.message
      );
      return;
    }
    const userEmail = userData.user.email;

    // 2. Obter os emails de todos os administradores
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("user:auth_users(email)")
      .eq("role", "admin");

    if (adminError || !admins || admins.length === 0) {
      console.error(
        "Não foi possível encontrar administradores:",
        adminError?.message
      );
      return;
    }

    const adminEmails = admins.map((a) => a.user.email).filter(Boolean);

    // 3. Enviar o e-mail para cada administrador
    for (const adminEmail of adminEmails) {
      await resend.emails.send({
        from: "Notificacao <notificacao@seusite.com>", // Use um email verificado no Resend
        to: adminEmail,
        subject: "Alerta: Utilizador sem créditos",
        html: `<p>O utilizador <strong>${userEmail}</strong> esgotou os seus créditos de consulta.</p><p>Por favor, aceda ao painel de administração para atribuir mais créditos.</p>`,
      });
    }
    console.log(
      `Notificação enviada aos administradores sobre o utilizador ${userEmail}.`
    );
  } catch (error) {
    console.error("Falha ao enviar e-mail de notificação:", error);
  }
};
// Middleware para verificar se o utilizador tem créditos
const hasCredits = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Se não houver token, permite continuar (usuário não logado)
    return next();
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    // Token inválido, mas permite continuar para a rota lidar com isso
    return next();
  }

  // Verifica os créditos do utilizador
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("query_credits, role")
    .eq("id", user.id)
    .single();

  // Se for admin, não gasta créditos
  if (profile && profile.role === "admin") {
    return next();
  }

  if (profileError || !profile || profile.query_credits <= 0) {
    return res
      .status(402) // Payment Required
      .json({ error: "Créditos de consulta esgotados." });
  }

  // Se o utilizador tem 1 crédito, ele vai ficar com 0 após esta operação.
  const willRunOutOfCredits = profile.query_credits === 1;

  // Decrementa o crédito
  await supabase
    .from("profiles")
    .update({ query_credits: profile.query_credits - 1 })
    .eq("id", user.id);

  // Se ficou sem créditos, notifica os admins
  if (willRunOutOfCredits) {
    notifyAdminsOnZeroCredits(user.id);
  }
  next();
};

// Endpoint para verificar e debitar créditos. Será chamado antes de cada cálculo.
app.post("/api/calculate", hasCredits, async (req, res) => {
  // O middleware 'hasCredits' já fez a verificação e o débito.
  // Se chegou até aqui, o utilizador tem permissão para calcular.
  res.json({ success: true, message: "Cálculo autorizado." });
});

// Endpoint da API para obter a taxa de câmbio
// A verificação de créditos foi removida daqui.
app.get("/api/exchange-rate", async (req, res) => {
  // Obtém o código do banco a partir dos parâmetros da query (ex: /api/exchange-rate?bank=BAI)
  const { bank } = req.query;

  if (!bank) {
    return res.status(400).json({ error: "O código do banco é obrigatório." });
  }

  try {
    // Converte o código do banco para maiúsculas para garantir consistência
    const bankCode = bank.toUpperCase();

    // Vai à tabela 'bank_rates' e busca a linha correspondente ao 'bank_code'
    const { data, error } = await supabase
      .from("bank_rates")
      .select("exchange_rate")
      .eq("bank_code", bankCode)
      .single();

    if (error) {
      // Se o erro for porque não encontrou nenhuma linha, envia uma mensagem amigável
      if (error.code === "PGRST116") {
        return res
          .status(404)
          .json({ error: `Taxa para o banco ${bankCode} não encontrada.` });
      }
      throw error; // Para outros erros, lança a exceção
    }

    // Envia a taxa de câmbio como resposta
    if (data) {
      res.json({ rate: data.exchange_rate });
    } else {
      // Fallback, embora o .single() com o tratamento de erro acima deva cobrir isto
      res
        .status(404)
        .json({ error: `Taxa para o banco ${bankCode} não encontrada.` });
    }
  } catch (error) {
    console.error(
      `Erro ao buscar a taxa de câmbio para ${bank} do Supabase:`,
      error
    );
    res.status(500).json({ error: "Não foi possível obter a taxa de câmbio." });
  }
});

// Endpoint da API para obter TODAS as taxas de câmbio (para o painel de admin)
app.get("/api/all-rates", async (req, res) => {
  try {
    // Vai à tabela 'bank_rates' e busca todos os registos, ordenados por código do banco
    const { data, error } = await supabase
      .from("bank_rates")
      .select("*")
      .order("bank_code", { ascending: true }); // Ordena por bank_code

    if (error) {
      throw error;
    }

    // Envia a lista de taxas como resposta
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar todas as taxas do Supabase:", error);
    res.status(500).json({ error: "Não foi possível obter as taxas." });
  }
});

// Endpoint da API para ATUALIZAR uma taxa de câmbio
app.put("/api/update-rate/:id", isAdmin, async (req, res) => {
  const { id } = req.params; // O ID da taxa a ser atualizada
  const { newRate } = req.body; // A nova taxa enviada no corpo do pedido

  if (!newRate || isNaN(newRate) || newRate <= 0) {
    return res.status(400).json({ error: "Valor da taxa inválido." });
  }

  try {
    const { data, error } = await supabase
      .from("bank_rates")
      .update({
        exchange_rate: newRate,
        updated_at: new Date().toISOString(), // Define a data de atualização para o momento atual
      })
      .eq("id", id) // Encontra a linha pelo ID
      .select() // Retorna os dados atualizados
      .single();

    if (error) {
      throw error;
    }

    res.json(data); // Envia a linha atualizada como confirmação
  } catch (error) {
    console.error(`Erro ao atualizar a taxa ${id}:`, error);
    res.status(500).json({ error: "Não foi possível atualizar a taxa." });
  }
});

// Endpoint da API para ADICIONAR uma nova taxa de banco
app.post("/api/add-rate", isAdmin, async (req, res) => {
  const { bank_code, exchange_rate } = req.body;

  // Validação básica
  if (!bank_code || !exchange_rate) {
    return res
      .status(400)
      .json({ error: "Código do banco e taxa são obrigatórios." });
  }
  if (isNaN(exchange_rate) || exchange_rate <= 0) {
    return res.status(400).json({ error: "Valor da taxa inválido." });
  }

  try {
    const { data, error } = await supabase
      .from("bank_rates")
      .insert([{ bank_code: bank_code.toUpperCase(), exchange_rate }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data); // Envia o novo registo criado com status 201 (Created)
  } catch (error) {
    console.error("Erro ao adicionar nova taxa:", error);
    res.status(500).json({ error: "Não foi possível adicionar a nova taxa." });
  }
});

// Endpoint da API para EXCLUIR uma taxa de banco
app.delete("/api/delete-rate/:id", isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from("bank_rates").delete().eq("id", id);

    if (error) {
      throw error;
    }

    // Envia uma resposta de sucesso sem conteúdo
    res.status(204).send();
  } catch (error) {
    console.error(`Erro ao excluir a taxa ${id}:`, error);
    res.status(500).json({ error: "Não foi possível excluir a taxa." });
  }
});

// Endpoint da API para obter TODOS os utilizadores (clientes)
app.get("/api/all-users", isAdmin, async (req, res) => {
  try {
    // Para obter dados dos utilizadores, precisamos de uma chamada autenticada.
    // No entanto, para uma lista de admin, podemos consultar a tabela 'profiles'
    // e fazer um join (se necessário) ou uma consulta separada.
    // Por simplicidade, vamos buscar todos os perfis e os seus emails.
    const { data, error } = await supabase
      .from("profiles")
      .select(`id, role, created_at, query_credits, user:auth_users(email)`);

    if (error) {
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar todos os utilizadores:", error);
    res
      .status(500)
      .json({ error: "Não foi possível obter a lista de utilizadores." });
  }
});

// Endpoint da API para ATUALIZAR a função (role) de um utilizador
app.put("/api/update-user-role/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { newRole } = req.body;

  if (!newRole || (newRole !== "admin" && newRole !== "user")) {
    return res.status(400).json({ error: "Função (role) inválida." });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Não foi possível atualizar a função do utilizador." });
  }
});

// Endpoint da API para ATUALIZAR os créditos de um utilizador
app.put("/api/update-user-credits/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { newCredits } = req.body;

  if (newCredits === undefined || isNaN(newCredits) || newCredits < 0) {
    return res.status(400).json({ error: "Número de créditos inválido." });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ query_credits: newCredits })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Não foi possível atualizar os créditos do utilizador." });
  }
});

// Endpoint para o utilizador solicitar mais créditos
app.post("/api/request-credits", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token em falta." });
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return res.status(401).json({ error: "Token inválido." });
  }

  try {
    // Obter os emails de todos os administradores
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("user:auth_users(email)")
      .eq("role", "admin");

    if (adminError || !admins || admins.length === 0) {
      throw new Error("Nenhum administrador encontrado para notificar.");
    }

    const adminEmails = admins.map((a) => a.user.email).filter(Boolean);

    // Enviar o e-mail para cada administrador
    for (const adminEmail of adminEmails) {
      await resend.emails.send({
        from: "Notificacao <notificacao@seusite.com>", // Use um email verificado no Resend
        to: adminEmail,
        subject: "Solicitação de Créditos",
        html: `<p>O utilizador <strong>${user.email}</strong> solicitou mais créditos de consulta.</p><p>Por favor, aceda ao painel de administração para analisar o pedido.</p>`,
      });
    }
    res.json({ success: true, message: "Pedido enviado aos administradores." });
  } catch (error) {
    res.status(500).json({
      error: `Não foi possível enviar a solicitação: ${error.message}`,
    });
  }
});

// Rotas para servir as páginas HTML
app.get("/", (req, res) => {
  // Rota para a página principal
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/my-profile.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "my-profile.html"));
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor a correr em http://localhost:${port}`);
  console.log("Acesse a aplicação no seu navegador neste endereço.");
});

// Exporta a aplicação para o Vercel
module.exports = app;
