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
    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ">
      {/* Header */}
      <header className="w-full">
        <div className=" mx-auto px-4 py-4 sm:py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                ChatApp
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-sm sm:text-base px-2 sm:px-4"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 text-sm sm:text-base px-3 sm:px-4"
              >
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full overflow-x-hidden  h-full">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight px-2">
              Connect with friends
              <span className="block text-blue-600 dark:text-blue-400">
                Share your world
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Join our vibrant community where you can chat, share posts, upload
              photos, and stay connected with people who matter most to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 max-w-md sm:max-w-none mx-auto">
              <Button
                size="lg"
                onClick={() => router.push("/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto"
              >
                Join ChatApp
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/login")}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-8 sm:py-12 lg:py-16 h-full">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-8 lg:mb-12 px-4">
              Everything you need to stay connected
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 px-4">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:shadow-gray-900/20">
                <CardContent className="p-4 sm:p-6 text-center">
                  <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-600 dark:text-blue-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 dark:text-white">
                    Real-time Chat
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Instant messaging with friends and groups. Never miss a
                    conversation.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:shadow-gray-900/20">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Share2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-600 dark:text-purple-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 dark:text-white">
                    Share Posts
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Share your thoughts, photos, and moments with your network.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:shadow-gray-900/20">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-600 dark:text-green-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 dark:text-white">
                    Follow Friends
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Build your network and follow people you care about.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:shadow-gray-900/20">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Heart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-red-600 dark:text-red-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 dark:text-white">
                    Like & Comment
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Engage with posts through likes, comments, and reactions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Features */}
          <div className="py-8 sm:py-12 lg:py-16 h-full">
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-gray-900/20 mx-4">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-8 lg:mb-12">
                  Built for the modern world
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  <div className="text-center">
                    <Globe className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600 dark:text-blue-400 mx-auto mb-2 sm:mb-3" />
                    <h4 className="font-semibold mb-1 sm:mb-2 dark:text-white text-sm sm:text-base">
                      Global Reach
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Connect with people worldwide
                    </p>
                  </div>
                  <div className="text-center">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-600 dark:text-green-400 mx-auto mb-2 sm:mb-3" />
                    <h4 className="font-semibold mb-1 sm:mb-2 dark:text-white text-sm sm:text-base">
                      Secure & Private
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Your data is protected
                    </p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-yellow-600 dark:text-yellow-400 mx-auto mb-2 sm:mb-3" />
                    <h4 className="font-semibold mb-1 sm:mb-2 dark:text-white text-sm sm:text-base">
                      Lightning Fast
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Real-time updates
                    </p>
                  </div>
                  <div className="text-center">
                    <Smartphone className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                    <h4 className="font-semibold mb-2 dark:text-white text-sm sm:text-base">
                      Mobile Ready
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Works on any device
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-8 sm:py-12 lg:py-16 text-center px-4 h-full">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 lg:mb-4">
              Ready to get started?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 lg:mb-8">
              Join thousands of users already connecting on ChatApp
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-6 sm:px-8 lg:px-12 py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg w-full sm:w-auto max-w-xs sm:max-w-sm"
            >
              Create Your Account
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-6 sm:py-8 lg:py-12 h-full mb-24">
        <div className=" mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-3 lg:mb-4">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <span className="text-base sm:text-lg lg:text-xl font-bold">ChatApp</span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 mb-2 sm:mb-3 lg:mb-4 text-xs sm:text-sm lg:text-base">
              Connecting people around the world
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 lg:gap-6 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
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
