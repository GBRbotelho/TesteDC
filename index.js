const fs = require("fs");
const path = require("path"); // Importando o módulo path para resolver o caminho de forma confiável
const https = require("https");

https.globalAgent.options.ca =
  fs.readFileSync(path.join(__dirname, "ca_bundle/certificado.pem")) +
  fs.readFileSync(
    path.join(__dirname, "ca_bundle/ca_intermediate_root_bundle.pem")
  );

console.log(fs.readFileSync(path.join(__dirname, "ca_bundle/certificado.pem")));

require("dotenv").config();
const express = require("express");
const axios = require("axios");

const Controller = {
  async authenticate(req, res) {
    try {
      const data = req.body;

      const authenticated = await login(data);

      if (authenticated.success) {
        res.status(200).json(authenticated);
      } else {
        res.status(400).json(authenticated);
      }
    } catch (error) {
      console.error("Erro ao autenticar:", error);
      res.status(500).json("Erro interno do servidor");
    }
  },
};

async function login(user) {
  const url =
    "https://godc.campinas.sp.gov.br/php/operacoes/usuarios_operacoes.php?usuarioLogin=true";
  const payload = new URLSearchParams({
    login_godc: user.username,
    password_godc: user.password,
    resolucao: "1314",
    mobile: "",
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await axios.post(url, payload, {
      headers,
    });

    if (
      response.data ===
      "<script>parent.location.href='../../index.php';</script>"
    ) {
      const cookies = response.headers["set-cookie"];
      const sessionCookie = cookies.find((cookie) =>
        cookie.startsWith("PHPSESSID")
      );

      return {
        success: true,
        cookie: sessionCookie.match(/PHPSESSID=([^;]+)/)[1],
      };
    } else {
      return { success: false, message: "Usuario/Senha invalido" };
    }
  } catch (error) {
    console.error("Erro ao realizar login:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      request: error.request,
    });
    return { success: false, message: "Erro ao realizar login:" };
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Cors
const cors = require("cors");
app.use(cors());

// BodyParser
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

app.post("/authenticate", Controller.authenticate);
app.get("/", (req, res) => {
  res.send("Bem vindo");
});
