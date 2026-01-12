#!/usr/bin/env python3
"""
Script para iniciar um servidor HTTP local para o Dashboard
Execute: python server.py
Depois acesse: http://localhost:8000
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8000
os.chdir(Path(__file__).parent)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

print("""
╔════════════════════════════════════════════════════════════════╗
║           📊 Dashboard DisplayCE - Servidor Local             ║
╚════════════════════════════════════════════════════════════════╝

✅ Servidor iniciado com sucesso!

🌐 Acesse: http://localhost:8000

📊 Dashboard: http://localhost:8000/index.html

⚠️  Para parar o servidor: Pressione Ctrl + C

""")

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"✨ Aguardando conexões na porta {PORT}...\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Servidor encerrado!")
