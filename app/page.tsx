"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle,
  Users,
  Share2,
  Heart,
  Globe,
  Shield,
  Zap,
  Smartphone,
} from "lucide-react";
import { useEffect } from "react";

export default function App() {
  const router = useRouter();

  // Add structured data to the home page
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "ChatApp",
      "url": "https://chatapp.com",
      "description": "Real-time messaging and social platform for instant communication",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://chatapp.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "sameAs": [
        "https://twitter.com/chatapp",
        "https://facebook.com/chatapp",
        "https://instagram.com/chatapp"
      ]
    });
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ChatApp
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push("/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="text-center py-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Connect with friends
            <span className="block text-blue-600 dark:text-blue-400">
              Share your world
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our vibrant community where you can chat, share posts, upload
            photos, and stay connected with people who matter most to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-8 py-3 text-lg"
            >
              Join ChatApp
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/login")}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 px-8 py-3 text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything you need to stay connected
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:shadow-gray-900/20">
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 dark:text-white">
                  Real-time Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Instant messaging with friends and groups. Never miss a
                  conversation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:shadow-gray-900/20">
              <CardContent className="p-6 text-center">
                <Share2 className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 dark:text-white">
                  Share Posts
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Share your thoughts, photos, and moments with your network.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:shadow-gray-900/20">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 dark:text-white">
                  Follow Friends
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Build your network and follow people you care about.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:shadow-gray-900/20">
              <CardContent className="p-6 text-center">
                <Heart className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 dark:text-white">
                  Like & Comment
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Engage with posts through likes, comments, and reactions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Features */}
        <div className="py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg dark:shadow-gray-900/20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Built for the modern world
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <Globe className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2 dark:text-white">
                  Global Reach
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Connect with people worldwide
                </p>
              </div>
              <div className="text-center">
                <Shield className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2 dark:text-white">
                  Secure & Private
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your data is protected
                </p>
              </div>
              <div className="text-center">
                <Zap className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2 dark:text-white">
                  Lightning Fast
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Real-time updates
                </p>
              </div>
              <div className="text-center">
                <Smartphone className="h-10 w-10 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2 dark:text-white">
                  Mobile Ready
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Works on any device
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of users already connecting on ChatApp
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/register")}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-12 py-4 text-lg"
          >
            Create Your Account
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <MessageCircle className="h-6 w-6" />
              <span className="text-xl font-bold">ChatApp</span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 mb-4">
              Connecting people around the world
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400 dark:text-gray-500">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
