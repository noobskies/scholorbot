import ChatWidget from "@/components/widget/ChatWidget";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Scholarship Chatbot</h1>
          <p className="text-xl">
            A customizable AI chatbot widget to help students find scholarships
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">About the Widget</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                The Scholarship Chatbot is an AI-powered widget that schools can embed on their websites
                to help students find scholarships. The chatbot uses advanced natural language processing
                to understand student queries and provide relevant scholarship information.
              </p>
              <p>
                The widget is customizable to match your school's branding and can be easily embedded
                on any website with a simple script tag.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">How to Embed</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                To embed the Scholarship Chatbot on your website, simply add the following script tag
                to your HTML:
              </p>
              <div className="bg-muted p-4 rounded-md overflow-x-auto mb-4">
                <pre className="text-sm">
                  {`<script
  src="https://your-domain.com/widget-embed.js"
  data-title="Scholarship Finder"
  data-subtitle="Ask me about scholarships!"
  data-position="bottom-right">
</script>`}
                </pre>
              </div>
              <p className="mb-4">
                You can customize the widget by changing the data attributes:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li><strong>data-title</strong>: The title displayed in the chat header</li>
                <li><strong>data-subtitle</strong>: The subtitle displayed in the chat header</li>
                <li><strong>data-position</strong>: The position of the widget (bottom-right, bottom-left, top-right, top-left)</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Demo</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                Try out the Scholarship Chatbot widget below:
              </p>
              <div className="bg-muted p-6 rounded-md h-96 flex items-center justify-center">
                <p className="text-muted-foreground">
                  The chatbot widget appears in the bottom-right corner of the page.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Scholarship Chatbot. All rights reserved.</p>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
