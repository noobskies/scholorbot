import ChatWidget from "@/components/widget/ChatWidget";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary-foreground/10 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">Scholarship Chatbot</h1>
          </div>
          <p className="text-xl ml-16">
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
                The widget is customizable to match your school&apos;s branding and can be easily embedded
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
      <footer className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8 shadow-inner">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="h-5 w-5 text-primary-foreground/80" />
            <p className="font-semibold">Scholarship Chatbot</p>
          </div>
          <p>&copy; {new Date().getFullYear()} Scholarship Chatbot. All rights reserved.</p>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
