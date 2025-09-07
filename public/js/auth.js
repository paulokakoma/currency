// Este ficheiro irá conter a lógica de autenticação (registo e login)

// É crucial que estas variáveis de ambiente sejam expostas de forma segura.
// No nosso caso, como é uma aplicação de frontend, usamos as chaves públicas (anon key).
const SUPABASE_URL = "https://jjyjxfczkquvuapfzkit.supabase.co"; // Substitua pela sua URL
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeWp4ZmN6a3F1dnVhcGZ6a2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNzA0ODUsImV4cCI6MjA3Mjg0NjQ4NX0.y93bJv6OnAxMAkEFV4PVZlCBZRh_LrCNDG-4Al_o6JQ"; // Substitua pela sua Chave Pública (Anon)

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const messageDiv = document.getElementById("message");

// Função para mostrar mensagens ao utilizador
function showMessage(text, type = "error") {
  messageDiv.textContent = text;
  messageDiv.className = type === "success" ? "text-green-600" : "text-red-600";
}

// Lógica de Registo
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = registerForm.email.value;
    const password = registerForm.password.value;

    showMessage("A criar a sua conta...", "success");

    const { data, error } = await _supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      showMessage(`Erro no registo: ${error.message}`);
    } else {
      // Como a confirmação de email está desativada, redireciona diretamente para a calculadora
      showMessage("Conta criada com sucesso! A entrar...", "success");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1500); // Espera 1.5 segundos antes de redirecionar
    }
  });
}

// Lógica de Login
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    showMessage("A fazer login...", "success");

    const { data, error } = await _supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showMessage(`Erro no login: ${error.message}`);
    } else {
      // Após o login, redireciona para a página principal da calculadora
      window.location.href = "/index.html";
    }
  });
}
