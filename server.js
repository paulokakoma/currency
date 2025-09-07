// Carrega as variáveis de ambiente do ficheiro .env
require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

// Cria a aplicação Express
const app = express();
const port = process.env.PORT || 3000;

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
app.use(express.static("public")); // Serve os ficheiros estáticos da pasta 'public'
app.use(express.json()); // Permite que o Express leia o corpo de pedidos JSON

// Endpoint da API para obter a taxa de câmbio
app.get("/api/exchange-rate", async (req, res) => {
  // Obtém o código do banco a partir dos parâmetros da query (ex: /api/exchange-rate?bank=BAI)
  const { bank } = req.query;

  if (!bank) {
    return res.status(400).json({ error: "O código do banco é obrigatório." });
  }

  try {
    // Converte o código do banco para maiúsculas para garantir consistência
    const bankCode = bank.toUpperCase();

    // Vai à tabela 'bank_rates' e busca a linha correspondente ao 'bank_code' do banco
    const { data, error } = await supabase
      .from("bank_rates")
      .select("exchange_rate") // CORRIGIDO: Seleciona a coluna 'exchange_rate'
      .eq("bank_code", bankCode) // CORRIGIDO: Filtra pelo 'bank_code'
      .single(); // Espera apenas um resultado

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
      res.json({ rate: data.exchange_rate }); // CORRIGIDO: Usa data.exchange_rate
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
app.put("/api/update-rate/:id", async (req, res) => {
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

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor a correr em http://localhost:${port}`);
});
