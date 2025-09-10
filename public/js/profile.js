const SUPABASE_URL = "https://jjyjxfczkquvuapfzkit.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeWp4ZmN6a3F1dnVhcGZ6a2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNzA0ODUsImV4cCI6MjA3Mjg0NjQ4NX0.y93bJv6OnAxMAkEFV4PVZlCBZRh_LrCNDG-4Al_o6JQ";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const updatePasswordForm = document.getElementById("update-password-form");
const messageDiv = document.getElementById("message");

// Função para mostrar mensagens ao utilizador
function showMessage(text, type = "error") {
  messageDiv.textContent = text;
  messageDiv.className = type === "success" ? "text-green-600" : "text-red-600";
}

// Verifica se o utilizador está logado ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await _supabase.auth.getSession();
  if (!session) {
    // Se não houver sessão, redireciona para a página de login
    window.location.href = "/login.html";
  }
});

if (updatePasswordForm) {
  updatePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = updatePasswordForm["new-password"].value;
    const confirmPassword = updatePasswordForm["confirm-password"].value;

    if (newPassword.length < 6) {
      showMessage("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("As palavras-passe não coincidem.");
      return;
    }

    showMessage("A atualizar a palavra-passe...", "info");

    const { data, error } = await _supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      showMessage(`Erro ao atualizar: ${error.message}`);
    } else {
      showMessage("Palavra-passe atualizada com sucesso!", "success");
      updatePasswordForm.reset();
      // Opcional: redirecionar para a calculadora após um tempo
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 2000);
    }
  });
}
