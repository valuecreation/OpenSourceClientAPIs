# ArcGIS REST JS Express Demo

NodeJS を使用したサーバーサイドのデモ
- OAuth 2.0 による ArcGIS Online 認証機構を実装、その認証のトークンを利用したジオコーディングとバッチジオコーディングを実装  
- おまけとして、API キーによるジオコーディングとバッチジオコーディングも実装

## Setup
1. npm install
2. https://developers.arcgis.com のダッシュボードの OAuth 2.0 でアプリを新規に作成
3. ダッシュボードの API Keys で API キーを作成
4. 2、3 で設定した内容を `config.json` に設定 
5. SESSION_SECRET と ENCRYPTION_KEY は、https://randomkeygen.com/ から生成して使用

## Running the demo
5. `npm start`
6. Visit http://localhost:3000/ to start the OAuth 2.0 process.

