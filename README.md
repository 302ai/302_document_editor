# 💻🤖 Welcome to 302.AI's AI Document Editor! 🚀✨

[中文](README_zh.md) | [English](README.md) | [日本語](README_ja.md)

This is the open-source version of [AI Document Editor](https://302.ai/tools/word/) from [302.AI](https://302.ai).
You can directly log in to 302.AI to use the online version with zero code and zero configuration.
Or modify this project according to your needs, input 302.AI's API KEY, and deploy it yourself.

## Interface Preview
![Interface Preview](docs/preview.jpg)
![Interface Preview](docs/preview2.jpg)
![Interface Preview](docs/preview3.jpg)   1

## ✨ About 302.AI ✨
[302.AI](https://302.ai) is a pay-as-you-go AI application platform, solving the last mile problem of AI practical applications for users.
1. 🧠 Combines the latest and most comprehensive AI capabilities and brands, including but not limited to language models, image models, voice models, and video models.
2. 🚀 Develops deep applications on basic models - we develop real AI products, not just simple chatbots
3. 💰 Zero monthly fee, all features are pay-per-use, fully open, achieving truly low barriers with high potential.
4. 🛠 Powerful management backend for teams and SMEs, one person manages, multiple people use.
5. 🔗 All AI capabilities provide API access, all tools are open source and customizable (in progress).
6. 💡 Strong development team, launching 2-3 new applications weekly, daily product updates. Developers interested in joining are welcome to contact us

## Project Features

### 🤖 AI Smart Assistant
- **Intelligent Translation**: Supports multiple language translations
- **Content Rewriting**: Smart content rewriting while maintaining original meaning
- **Smart Summarization**: Automatically generates full text or paragraph summaries
- **AI Illustrations**: Automatically generates relevant illustrations based on text content
- **Information Retrieval**: Smart search and summary generation of information

### ✍️ Text Editing Enhancement
- **Paragraph Processing**
  - Smart rewriting
  - Automatic summarization
  - Multi-language translation
  - Content expansion
  - Smart compression
  - Context continuation
- **Editing Operations**
  - Text replacement
  - Smart insertion
  - Quick copy

### 🌍 Multi-language Support
- Chinese Interface
- English Interface
- Japanese Interface

Through the AI Document Editor, we provide comprehensive support for creation, including multi-language translation, content rewriting, smart summarization, illustration generation, and more, making the creation process more smooth and efficient. 🎉💻 Let's explore the new world of AI-driven code together! 🌟🚀

🛠️ Tech Stack
Frontend Framework: Next.js
Editor Core: Novel.js
Internationalization: next-i18next

## Development & Deployment
1. Clone project `git clone https://github.com/302ai/302_document_editor`
2. Install dependencies `pnpm install`
3. Configure 302's API KEY (refer to .env.example)
4. Run project `pnpm dev`
5. Build and deploy `docker build -t document-editor . && docker run -p 3000:3000 302_document-editor`

