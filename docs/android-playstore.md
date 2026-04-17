# StoryForge Android / Google Play

## Estratégia escolhida

O projeto usa **Vite + React** e já possui uma base **Capacitor + Android**.
Por isso, a estratégia adotada foi **preservar a versão web existente** e empacotar a aplicação atual em um shell Android com Capacitor.

Essa abordagem foi a mais adequada porque:

- evita reescrever o app em React Native
- preserva rotas, autenticação e lógica já existentes
- mantém a web na Vercel funcionando
- permite gerar **APK** para testes e **AAB** para submissão na Google Play

## Arquivos importantes

- `capacitor.config.ts`
- `android/app/build.gradle`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/keystore.properties.example`

## Preparação da assinatura

1. Gere o keystore de release:

```powershell
keytool -genkey -v -keystore keystores/storyforge-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias storyforge
```

2. Crie o arquivo `android/keystore.properties` com base em `android/keystore.properties.example`.

3. Preencha:

- `storeFile`
- `storePassword`
- `keyAlias`
- `keyPassword`

Esse arquivo **não deve** ir para o Git.

## Ambiente de build

Antes do build release no Windows, use o JDK do Android Studio:

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
```

O projeto também já foi preparado com `android.overridePathCheck=true` para não falhar por causa do caminho com acentos do Windows/OneDrive.

## Build web + sync Android

```powershell
npm install
npm run android:build
```

Esse comando:

- gera o build web em `dist`
- sincroniza os assets no projeto Android

## Gerar APK de release

```powershell
npm run android:release:apk
```

Saída esperada:

- `android/app/build/outputs/apk/release/app-release.apk`

## Gerar AAB para Google Play

```powershell
npm run android:release:aab
```

Saída esperada:

- `android/app/build/outputs/bundle/release/app-release.aab`

## Arquivo para subir na Google Play

Use este arquivo para publicação:

- `android/app/build/outputs/bundle/release/app-release.aab`

O APK é útil para testes internos, mas a Play Store pede o **AAB**.

## Checklist antes da publicação

- revisar `versionCode` e `versionName` em `android/app/build.gradle`
- confirmar ícone, splash e nome do app
- validar login, cadastro, recuperação de senha e sessão
- validar criação de projeto e leitura de obra pública
- abrir o app novamente após fechar para confirmar persistência da sessão
- testar em aparelho Android real e emulador
