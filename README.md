# Explorador de Sistemas Dinâmicos (Web)

Você pode rodar este app **no seu computador** (Windows, macOS ou Linux) usando um servidor local simples.

## Onde rodar?
- Em qualquer máquina com navegador moderno (Chrome/Edge/Firefox/Safari) e `python3` instalado.
- Também funciona em VS Code, Codespaces, Gitpod, ou servidor Linux via SSH com port-forwarding.

## Passo a passo (rápido)
No terminal, dentro da pasta do projeto:

```bash
bash scripts/run_local.sh
```

Depois abra no navegador:

- <http://localhost:8080>

> Se quiser outra porta:

```bash
bash scripts/run_local.sh 3000
```

## Opção direta (sem script)
```bash
python3 -m http.server 8080
```

## Testar se está tudo OK
```bash
bash scripts/smoke_test.sh
```

## Recursos da aplicação
- Simulação de sistemas de 2ª ordem (mecânico, elétrico e térmico)
- Integração RK4
- Gráficos: resposta temporal, fase e FRF
- Presets e tema claro/escuro
