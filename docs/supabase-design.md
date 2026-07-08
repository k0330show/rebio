# Rebio Supabase 設計ドキュメント

このドキュメントは、Rebio を localStorage ベースのデモ MVP から実用版へ移行する際の
データベース設計・認証方針・ストレージ方針をまとめたものです。

**現時点ではこのドキュメントは設計のみであり、実装（v13）はこの設計に基づいて行います。**

---

## 1. 目的

- 現在は単一ブラウザの `localStorage` にすべてのデータが保存されており、複数ユーザー・複数デバイスでの共有ができない
- Supabase（PostgreSQL + Auth + Storage）へ移行することで、チーム単位でのクラウド共有・認証・ファイル保存を実現する
- 移行は段階的に行う。v13 でデータ永続化層、v14 でファイルストレージ、v15 で運用面の仕上げを行う

## 2. 全体アーキテクチャ

```
┌─────────────────────┐
│   Next.js (App Router) │
│                         │
│  UI コンポーネント       │
│       ↓                │
│  repository層           │  ← v13で新設。UIはこの層のみを呼ぶ
│   ├─ local (localStorage)
│   └─ supabase (Supabase Client)
└─────────────────────┘
          ↓ (supabaseモード時のみ)
┌─────────────────────┐
│   Supabase              │
│  ├─ Auth               │
│  ├─ PostgreSQL (RLS)   │
│  └─ Storage            │
└─────────────────────┘
```

UI コンポーネントは `repository` 層（`app/lib/repositories/*`）のみを呼び出し、
その内部でモード（`local` / `supabase`）に応じて `localStorage` または Supabase Client を切り替える。
この構造により、Supabase 未設定環境でもアプリ全体が問題なく動作する。

## 3. チーム・組織構造の考え方

現在のデモ組織マスタ（`DEMO_USERS` / `DEMO_DEPARTMENTS` / `DEMO_ROLES`）は、
Supabase移行後は「チーム」という概念の下に配置される。

- 1つの `team` が1つの現場（施設・店舗・拠点など）に対応する
- `team_members` でユーザーとチームを紐づける（1ユーザーが複数チームに属することも許容）
- `departments` / `roles` / `shifts` はチームごとに自由に定義できる（Rebioが業種を決めすぎない設計思想を維持）

## 4. 認証方針

- **Supabase Auth** を使用する
- 初期実装では **メールアドレス＋パスワード** または **Google OAuth** のいずれかを想定する（実装時に選択）
- ログイン後、`profiles` テーブルに1行作成する（Supabase Authの `user.id` を外部キーとして使う）
- 新規ユーザーは自分でチームを作成するか、既存チームへの招待を受けて `team_members` に追加される
- `currentUser` は常に Supabase Auth の `auth.uid()` に紐づく `profiles` の1行として扱う

## 5. データ移行の段階

| フェーズ | 内容 |
|---|---|
| v12（本ドキュメント） | 設計のみ。テーブル定義・RLS方針・認証方針を明文化 |
| v13 | Supabaseクライアント導入、repository層の新設、work_logs/handovers/tasks等をSupabase保存対象に |
| v14 | Supabase Storageによる実ファイルアップロード対応（Library） |
| v15 | エラー処理・履歴機能・権限の見せ方・デプロイ手順の整備 |

## 6. Rebioのコンセプトを壊さないための制約

Supabase化にあたっても、以下は変更しない。

- 送信対象指定（全体/部署/個人/役職/シフト）の5種類
- 申し送りの3分類（共有事項/確認してほしい/対応が必要）
- コメントは申し送りへの補足であり、チャット機能を追加しない
- タスクは「対応が必要」な申し送りからのみ生成される
- 通知センター・DM・権限管理UIなど、Rebioを重い管理システムにする機能は実装しない

## 7. 関連ドキュメント

- テーブル定義：`docs/supabase-schema.sql`
- RLS方針：`docs/supabase-rls.md`
- 実用化ロードマップ：`docs/production-roadmap.md`
