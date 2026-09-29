# Kiroilukassa

Yhteinen kiroilukassa porukalle, pariskunnalle tai vaikka kaveriporukalle.

Kun joku kiroilee, painetaan nappia ja kassaan lisätään ennalta määritetty summa. Jokaiselle käyttäjälle kertyy oma osuutensa kassasta. Kerran kuussa kassa voidaan tilittää, jolloin kyseinen kuukausi siirtyy historiaan.

Sovellus on tehty React Nativella, Expolla ja TypeScriptillä. Sama koodi toimii sekä puhelimessa että selaimessa.

## Käynnistys

```bash
npm install
npm run web      # selain: http://localhost:8081
npm start        # puhelin: avaa Expo Go ja lue QR-koodi
```

Tyypit ja testit voi tarkistaa komennoilla:

```bash
npm run typecheck
npm test
```

Testit kohdistuvat `src/domain`-kansion logiikkaan: rahan käsittelyyn, kassan
laskentaan, tilitykseen ja päivämääriin. Ne ajetaan Nodessa ilman selainta tai
puhelinta, joten ne valmistuvat noin sekunnissa.

## Paikallinen tai jaettu kassa

Ilman Supabase-asetuksia sovellus toimii paikallisesti yhdellä laitteella. Kirjautumista tai muita asetuksia ei tarvita.

Jos samaa kassaa halutaan käyttää usealla laitteella, tarvitaan Supabase.

1. Luo projekti osoitteessa [supabase.com](https://supabase.com). Ilmainen taso riittää.
2. Ota käyttöön **Authentication → Sign In / Providers → Anonymous Sign-Ins**.
3. Avaa **SQL Editor**, liitä sinne `supabase/schema.sql` ja suorita se.
4. Kopioi `.env.example` tiedostoksi `.env` ja lisää sinne Supabasen **Project Settings → API** -sivulta löytyvät arvot.

Kun sovellus käynnistetään tämän jälkeen, käyttöönotossa voi:

- luoda uuden kassan
- liittyä olemassa olevaan kassaan kutsukoodilla

Uuden kassan luonnin yhteydessä saat kuusimerkkisen kutsukoodin. Koodi löytyy myöhemmin myös Asetuksista.

Muut käyttäjät voivat liittyä samaan kassaan samalla kutsukoodilla. Kaikkien tekemät painallukset näkyvät muille automaattisesti ilman sivun päivittämistä.

Erillistä käyttäjätunnusta tai salasanaa ei tarvita. Supabasen anonyymi kirjautuminen antaa jokaiselle laitteelle oman tunnisteen, ja kutsukoodi määrittää, mihin kassaan käyttäjä pääsee käsiksi.

## Käyttö puhelimella ilman App Storea

Sovelluksen voi julkaista verkkoversiona, jolloin sitä ei tarvitse asentaa sovelluskaupasta.

Julkaisu tehdään tietokoneelta:

```bash
npm run build:web -- --clear
npx vercel deploy --prod dist
```

Vercelin sijaan voi käyttää esimerkiksi Netlifyta tai Cloudflare Pagesia.

`--clear` tyhjentää käännösvälimuistin. Expo upottaa `EXPO_PUBLIC_*`
-ympäristömuuttujat valmiiseen bundleen käännöksen aikana, ja välimuisti voi
muuten säilyttää vanhat arvot. Silloin julkaistu versio ottaisi yhteyttä
väärään tietokantaan.

Julkaisun jälkeen sovellus löytyy yhdestä osoitteesta, esimerkiksi:

```text
https://kiroilukassa.vercel.app
```

Puhelimella:

1. Avaa osoite selaimessa.
2. Valitse jakovalikosta **Lisää Koti-valikkoon**.

Tämän jälkeen sovelluksella on oma kuvake ja se avautuu puhelimessa sovelluksen tapaan.

Muut käyttäjät avaavat saman osoitteen, valitsevat **Liity koodilla** ja syöttävät kassan kutsukoodin.

Päivitykset julkaistaan buildaamalla ja deployaamalla verkkoversio uudelleen:

```bash
npm run build:web -- --clear
npx vercel deploy --prod dist
```

Käyttäjien ei tarvitse tehdä päivityksen yhteydessä mitään.

Apple Developer -tiliä tai App Store -julkaisua ei tarvita. Jos sovellus halutaan myöhemmin julkaista natiivina, samasta projektista voidaan tehdä buildit EAS Buildilla.

## Projektin rakenne

```text
app/                 Expo Router -näkymät
  (tabs)/            Kassa, Historia, Asetukset
  entries/[scope]    yksittäiset painallukset kellonaikoineen
  settle             tilityksen yhteenveto

src/domain/          raha-, kassa-, tilitys- ja päivämäärälogiikka
src/storage/         LedgerRepository sekä local- ja Supabase-toteutukset
src/state/           React context ja sovelluksen kirjoittava tila
src/components/      UI-komponentit
src/theme/           design-tokenit

supabase/schema.sql  tietokannan rakenne ja käyttöoikeudet
```

Riippuvuudet kulkevat alaspäin niin, että `src/domain` ei riipu Reactista tai React Nativesta.

Domain-logiikkaa voi tämän vuoksi testata suoraan Nodessa ja tarvittaessa käyttää myöhemmin myös palvelinpuolella.

## Toteutuspäätökset

### Raha käsitellään sentteinä

Kaikki rahasummat tallennetaan kokonaislukuina sentteinä.

Esimerkiksi 0,20 € tallennetaan arvona `20`.

Näin laskennassa vältetään liukulukujen aiheuttamat pyöristysongelmat.

### Saldo lasketaan tapahtumista

Saldoa ei tallenneta erillisenä arvona tietokantaan, vaan se muodostetaan kassan tapahtumista.

Jos tapahtuma kumotaan, sitä ei poisteta kokonaan. Sille asetetaan `deletedAt`.

Kun kuukausi tilitetään, tapahtumat merkitään `settlementId`:llä.

Näin tapahtumahistoria säilyy ja muutokset synkronoituvat luotettavasti usean laitteen välillä.

<img width="1672" height="941" alt="image" src="https://github.com/user-attachments/assets/8d9e106e-6e71-4b88-8314-18fb2eb6096e" />



