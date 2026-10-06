# QA portfolio - stručný přehled

Toto repo je anonymizovaný výřez reálného rezervačního systému pro detailing.
Slouží jako ukázka toho, jak přemýšlím nad kvalitou, riziky a automatizovaným
testováním API.

Nejde o celý produkční projekt. Neobsahuje zákaznická data, databázi, hesla ani
produkční přístupové údaje.

## Co aplikace umí

- vrátit katalog služeb;
- vypočítat cenu a délku zakázky;
- zohlednit typ vozidla a stav interiéru;
- ověřit pracovní dobu a minimální 48hodinový předstih;
- zabránit překryvu dvou aktivních rezervací;
- vytvořit rezervaci;
- řídit povolené změny stavu zakázky.

## Jak request prochází aplikací

```text
HTTP request
-> DTO validace vstupu
-> Controller přijme požadavek
-> Service řídí proces
-> Domain obsahuje obchodní pravidla
-> HTTP response
```

Data se ukládají pouze do paměti. Po restartu aplikace zmizí. Díky tomu lze
ukázku bezpečně spustit bez PostgreSQL a produkčních údajů.

## Struktura

```text
src/             ukázkový NestJS backend
test/unit/       unit testy doménové logiky
test/e2e/        TypeScript testy skutečných HTTP endpointů
qa/tests/        nezávislé black-box API testy v Pythonu
docs/            strategie, API kontrakt, traceability a bug report
.github/         CI pipeline pro GitHub Actions
```

Nejdůležitější soubor s pravidly je
`src/reservations/reservation-domain.ts`.

## Spuštění

```powershell
npm install
npm run build
npm test
npm start
```

API následně běží na `http://127.0.0.1:3100/api`.

Python testy se spouštějí ve druhém terminálu, zatímco API běží:

```powershell
cd qa
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -v
```

## Testovací vrstvy

- Unit testy rychle ověřují výpočty, hranice a stavový automat.
- E2E testy ověřují NestJS routing, DTO validaci a HTTP statusy.
- Python testy přistupují k systému jako externí klient a neznají jeho vnitřní
  implementaci.

Podrobnější anglické informace jsou v `README.md`. Vlastní poznámky k prezentaci
jsou v `docs/INTERVIEW_NOTES_CS.md`.
