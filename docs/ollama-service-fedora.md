# Running Ollama as a Background Service on Fedora (Framework Desktop)

## 1. Install Ollama
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama --version
ollama serve &
curl http://localhost:11434
```

## 2. Create a systemd User Service
```bash
mkdir -p ~/.config/systemd/user
nano ~/.config/systemd/user/ollama.service
```

Paste:
```ini
[Unit]
Description=Ollama LLM Service
After=network.target

[Service]
ExecStart=%h/.local/bin/ollama serve
Restart=always
RestartSec=5
Environment=OLLAMA_HOST=0.0.0.0
Environment=OLLAMA_ORIGINS=*
Environment=OLLAMA_MODELS=%h/.ollama/models
Environment=OLLAMA_KEEP_ALIVE=10m
WorkingDirectory=%h
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

## 3. Enable & Start
```bash
systemctl --user daemon-reload
systemctl --user enable --now ollama
systemctl --user status ollama
```

Make it start before login:
```bash
loginctl enable-linger $USER
```

## 4. Firewall (optional for LAN)
```bash
sudo firewall-cmd --permanent --add-port=11434/tcp
sudo firewall-cmd --reload
```

## 5. Enable GPU Acceleration
```bash
sudo dnf install mesa-vulkan-drivers vulkan-tools
vulkaninfo | grep deviceName
```

## 6. Optimize Performance
```bash
sudo dnf install tuned
sudo systemctl enable --now tuned
sudo tuned-adm profile latency-performance
```

## 7. Test Models
```bash
ollama pull mistral
ollama run mistral
time ollama run phi3:mini -p "Summarize this paragraph about climate news."
```

Expected speeds (Ryzen AI Max 385 APU):
| Model | Tokens/s | Notes |
|--------|-----------|-------|
| Phi-3 Mini (3.8B) | ~50 | Fast |
| Mistral (7B) | ~25–30 | Good balance |
| Llama 3 (8B) | ~20–25 | Heavier load |

## 8. API Example
```bash
curl -X POST http://localhost:11434/api/generate   -d '{"model":"mistral","prompt":"Classify this headline"}'
```

## 9. Summary
| Step | Purpose |
|------|----------|
| Install Ollama | Fetch binary |
| Create service | Run persistently |
| Enable systemd | Auto-start |
| Add Vulkan | GPU acceleration |
| Tune profile | Max performance |
| Firewall | Secure exposure |
