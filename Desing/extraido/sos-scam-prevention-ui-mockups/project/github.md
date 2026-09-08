repo: luisfernandomedh/constata
branch: main
path: docs

## Last sync
date: 2026-09-08T16:12:00Z

### Updated in this project
- Built a 7-screen SOS redesign of the single-page tool, ES and EN sets.
- Reused the repo's palette tokens, risk vocabulary and voice rules verbatim.
- Verdict is a sentence plus evidence; the 0–100 score is not shown on screen.
- Demo case is verification-code theft (authentic bank SMS, unrequested).

## Screen map
| Project screen | Repo files |
|---|---|
| 1a / 1h Start | docs/index.html (vista-inicio, promesa, ejemplos) |
| 1b / 1i Message pasted | docs/index.html (textarea, botones) |
| 1c / 1j Checking | docs/index.html (vista-analizando) |
| 1d / 1k Result — static | docs/index.html (vista-resultado, VEREDICTOS), src/types.ts, README.md |
| 1e / 1l Result — conversational | docs/index.html (conversar, SUGERENCIAS), worker/instrucciones.js |
| 1f / 1m Already gave the code | worker/instrucciones.js (CUANDO EL ROBO YA OCURRIÓ) |
| 1g / 1n No known signals | docs/index.html (riesgo bajo), docs/como-funciona.html |
