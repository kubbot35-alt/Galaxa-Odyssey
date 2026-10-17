# Galaxa Odyssey

Galaxa Odyssey to przeglądarkowa gra arcade o kosmicznej walce. Projekt łączy trójwymiarowy hangar i pole bitwy z walką w kolejnych falach przeciwników. Interfejs obsługuje język polski i angielski.

## Funkcje

- Hangar 3D ze zmianą widoku kamery, wyborem wyglądu statku i kinową sekwencją startową.
- Walka z falami przeciwników, bossami, tarczami, radarowym namierzaniem celów i efektami cząsteczkowymi.
- Tryb dla jednego gracza lub lokalny tryb współpracy dla dwóch graczy.
- Trzy poziomy trudności oraz cztery tryby uzbrojenia: działo pulsacyjne, potrójny strzał, hiperlaser i rozrzut plazmowy.
- Osiągnięcia, kredyty i postęp pilota zapisywane lokalnie w przeglądarce.
- Sterowanie klawiaturą, kontrolerem Gamepad API oraz ekranowymi przyciskami dotykowymi.
- Ustawienia dźwięku, efektów cząsteczkowych i języka interfejsu.

## Wymagania

- Node.js 20 lub nowszy i npm.
- Nowoczesna przeglądarka z obsługą WebGL 2, `localStorage` oraz Web Audio API.
- Kontroler jest opcjonalny i wymaga obsługi Gamepad API w przeglądarce.
- Nie jest wymagany backend ani konfiguracja zmiennych środowiskowych.
- Dostęp do internetu jest potrzebny do pobrania fontów Google używanych przez interfejs.

## Uruchomienie

```bash
npm ci
npm run dev
```

Vite wyświetli lokalny adres gry w terminalu.

## Budowanie i testowanie

```bash
npm run build
npm test
npm run preview
```

`npm run build` sprawdza typy TypeScript i tworzy produkcyjną wersję w katalogu `dist/`. `npm test` uruchamia testy Vitest, a `npm run preview` pozwala lokalnie sprawdzić gotowy build. Opcjonalne `npm run sounds` uruchamia generator dźwięków.

## Sterowanie

| Akcja | Sterowanie |
|---|---|
| Ruch gracza 1 | Strzałki |
| Strzał gracza 1 | `Spacja` |
| Ruch gracza 2 w trybie współpracy | `W` / `A` / `S` / `D` |
| Strzał gracza 2 | `F` |
| Wybór trybu uzbrojenia | `1`–`4` |
| Poprzednia / następna broń | `Q` / `E` |
| Zmiana kamery | `V` |
| Pełny ekran | `F` |
| Osiągnięcia | `B` |
| Pauza / wznowienie | `Esc` |

Menu obsługuje mysz. Na ekranach dotykowych dostępne są wirtualne przyciski. Można również podłączyć kontroler obsługiwany przez Gamepad API.

## Języki

Domyślnym językiem gry jest polski (`pl-PL`). Angielski (`en-US`) można włączyć w menu **Diagnostics**, wybierając **ENGLISH** w ustawieniach języka. Wybór jest zapisywany w pamięci lokalnej przeglądarki i zachowywany przy kolejnych uruchomieniach.

Tłumaczenia znajdują się w `src/config/content/locales/`: `pl-PL.ts` definiuje domyślny słownik i typowany schemat, a `en-US.ts` dostarcza angielskie teksty zgodne z tym schematem. Dodając lub zmieniając tekst interfejsu, należy aktualizować oba słowniki, aby zachować kompletność tłumaczeń. Język dokumentacji i kodu może być inny niż język interfejsu.

## Technologie

- React 19 i TypeScript
- Vite
- Three.js do renderowania scen 3D
- Tailwind CSS
- Web Audio API
- Vitest

## Zapisane dane

Ustawienia, wybrany język, osiągnięcia i postęp gry są przechowywane w `localStorage` bieżącej przeglądarki. Dane nie są synchronizowane między urządzeniami. Profil można wyczyścić z menu ustawień gry.

## Proponowane następne zmiany

- Dodać testy weryfikujące kompletność słowników i zgodność tłumaczeń PL/EN.
- Umożliwić zmianę przypisań klawiszy i konfigurację kontrolera z poziomu gry.
- Skonfigurować CI do uruchamiania `npm ci`, `npm run build` i `npm test` przy każdej zmianie.
- Dodać zrzuty ekranu oraz instrukcję wdrożenia i hostowania produkcyjnej wersji.
