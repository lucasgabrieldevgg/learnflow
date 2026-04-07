import type { NextConfig } from "next";

// ⚠️ IMPORTANTE para GitHub Pages:
// Se o repositório for github.com/SEU_USER/learnflow (NÃO for org page),
// descomente a linha abaixo e ajuste o nome do repo:
// const repoName = '/learnflow';
// E adicione: basePath: repoName, assetPrefix: repoName

const nextConfig: NextConfig = {
  // 'export' gera arquivos estáticos HTML/CSS/JS (necessário para GitHub Pages)
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Desativa otimização de imagens (não funciona em static export sem loader)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
