# Attribia

A customizable AI-powered chatbot widget that helps students find scholarships. This widget can be embedded on school websites to provide an interactive way for students to discover scholarship opportunities.

## Features

- **AI-Powered Chat Interface**: Uses OpenAI's GPT models to understand and respond to student queries about scholarships
- **Customizable Widget**: Schools can customize the appearance and position of the widget to match their branding
- **Easy Integration**: Simple embed script that can be added to any website
- **Custom Dataset Support**: Upload and process scholarship data from PDF and CSV files
- **FERPA Compliant**: Designed with student privacy in mind

## Getting Started

### Prerequisites

- Node.js 18.x or later
- OpenAI API key
- Supabase account (for database and authentication)

### Environment Setup

1. Clone this repository
2. Copy `.env.local.example` to `.env.local` and fill in your API keys:

```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Widget Configuration
NEXT_PUBLIC_WIDGET_TITLE="Attribia"
NEXT_PUBLIC_WIDGET_SUBTITLE="Ask me about scholarships!"
```

### Database Setup

Create the following tables in your Supabase database:

1. `scholarships` table:

   - `id` (uuid, primary key)
   - `name` (text)
   - `description` (text)
   - `amount` (text)
   - `deadline` (text)
   - `eligibility` (text)
   - `application_url` (text)
   - `organization` (text)
   - `tags` (array)

2. `chat_sessions` table:

   - `id` (uuid, primary key)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

3. `chat_messages` table:
   - `id` (uuid, primary key)
   - `session_id` (uuid, foreign key to chat_sessions.id)
   - `role` (text)
   - `content` (text)
   - `timestamp` (bigint)

### Running the Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Embedding the Widget

To embed the Attribia widget on your website, add the following script tag to your HTML:

```html
<script
  src="https://your-domain.com/widget-embed.js"
  data-title="Attribia"
  data-subtitle="Ask me about scholarships!"
  data-primary-color="#4F46E5"
  data-position="bottom-right"
></script>
```

You can customize the widget by changing the data attributes:

- **data-title**: The title displayed in the chat header
- **data-subtitle**: The subtitle displayed in the chat header
- **data-primary-color**: The primary color for the widget (hex code)
- **data-position**: The position of the widget (bottom-right, bottom-left, top-right, top-left)

## Adding Scholarship Data

1. Navigate to the admin page at [http://localhost:3000/admin](http://localhost:3000/admin)
2. Upload PDF or CSV files containing scholarship information
3. The system will process the files and extract scholarship data

## Deployment

The easiest way to deploy this application is to use [Vercel](https://vercel.com):

1. Push your code to a GitHub repository
2. Import the repository to Vercel
3. Set up your environment variables
4. Deploy

## License

This project is licensed under the MIT License - see the LICENSE file for details.
