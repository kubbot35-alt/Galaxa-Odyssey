# Galaxa Odyssey

Galaxa Odyssey to futurystyczna gra typu arcade space shooter napisana w Javie z użyciem Swing. Gracz steruje statkiem kosmicznym, niszczy fale przeciwników, zbiera power-upy i rozwija uzbrojenie.

## Funkcje

- futurystyczne menu główne z grafikami ładowanymi z `src/main/resources`,
- tryby `PLAY`, `UPGRADES`, `SETTINGS` i `HOW TO PLAY`,
- kolejne fale przeciwników o rosnącym poziomie trudności,
- automatyczny ogień po przytrzymaniu klawisza `SPACE`,
- różne typy przeciwników i pociski przeciwników,
- osłona, życia, wynik, fale i kredyty,
- ulepszenia broni: podwójne i potrójne działka,
- power-upy zwiększające liczbę żyć lub poziom broni,
- efekty dźwiękowe i generowana muzyka menu,
- animowane gwiazdy, eksplozje i cząsteczki,
- zapisany w GitHub przebieg rozwoju projektu.

## Wymagania

- Java 8 lub nowsza,
- Maven 3.6 lub nowszy,
- system z obsługą Java Swing.

Projekt jest skonfigurowany do kompilacji z użyciem Java 8.

Stan gry zapisuje się automatycznie przy wejściu w pauzę. Zapisywane są
życia, poziom broni, punkty, etap, kredyty i odblokowane ulepszenia. Wybranie
`PLAY` z menu wczytuje zapisany stan, jeśli istnieje. Plik zapisu znajduje się
w pliku `out/save.json` w katalogu projektu. Stan jest
również zapisywany przy zamknięciu okna gry.

## Uruchomienie

### Maven

```bash
mvn clean package
```

Następnie uruchom klasę `org.example.Main` z poziomu IDE albo użyj:

```bash
java -cp target/classes org.example.Main
```

### IntelliJ IDEA

1. Otwórz projekt jako projekt Maven.
2. Poczekaj na załadowanie zależności i konfiguracji.
3. Uruchom klasę `org.example.Main`.

## Sterowanie

| Klawisz | Działanie |
|---|---|
| `A` / `D` | ruch statku w lewo i w prawo |
| `←` / `→` | ruch statku w lewo i w prawo |
| `SPACE` | strzelanie; przytrzymanie włącza ogień ciągły |
| `ESC` | pauza; w pauzie powrót do gry |
| `↑` / `↓` | wybór pozycji w menu |
| `ENTER` | zatwierdzenie wyboru; w pauzie zapis i powrót do menu |

W menu można również korzystać z myszy.

## Struktura projektu

```text
src/
├── main/
│   ├── java/org/example/
│   │   ├── model/
│   │   │   ├── GameModel.java
│   │   │   ├── GameState.java
│   │   │   ├── GameObjectFactory.java
│   │   │   ├── MenuOption.java
│   │   │   ├── UpgradeOption.java
│   │   │   ├── SettingsOption.java
│   │   │   ├── EnemyType.java
│   │   │   ├── PowerUpType.java
│   │   │   ├── Player.java
│   │   │   ├── Enemy.java
│   │   │   ├── Bullet.java
│   │   │   ├── PowerUp.java
│   │   │   ├── Particle.java
│   │   │   └── Star.java
│   │   ├── controller/
│   │   │   ├── Main.java
│   │   │   └── GameController.java
│   │   └── view/
│   │       ├── GalagaGame.java
│   │       ├── GamePanel.java
│   │       ├── ResourceLoader.java
│   │       └── SoundEffects.java
│   └── resources/
│       ├── menu/
│       └── META-INF/
└── ...
```

Logika domenowa jest oddzielona od tworzenia obiektów i stanu interfejsu:
`GameModel` przechowuje dane, `GameController` wykonuje akcje użytkownika,
`GamePanel` renderuje widok, a `GameObjectFactory` centralizuje tworzenie
obiektów gry. Klasy encji ukrywają swoje pola i udostępniają operacje
biznesowe zamiast bezpośredniej modyfikacji stanu.

## Licencja

Projekt edukacyjny i demonstracyjny. Brak osobnej licencji komercyjnej.
