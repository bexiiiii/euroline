"use client"

import { AuthorCard } from "@/components/ui/content-card"

const mockData = [
  {
    id: 1,
    backgroundImage: "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1651&q=80",
    author: {
      name: "Auto Parts News",
      avatar: "https://ui.aceternity.com/_next/image?url=%2Fmanu.png&w=256&q=75",
      readTime: "2 min read"
    },
    content: {
      title: "Author Card 1",
      description: "Card with Author avatar, complete name and time to read - most suitable for blogs."
    }
  },
  {
    id: 2,
    backgroundImage: "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1651&q=80",
    author: {
      name: "Another Author",
      avatar: "https://ui.aceternity.com/_next/image?url=%2Fmanu.png&w=256&q=75",
      readTime: "3 min read"
    },
    content: {
      title: "Author Card 2",
      description: "Another news card description."
    }
  },
  {
    id: 3,
    backgroundImage: "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1651&q=80",
    author: {
      name: "Another Author",
      avatar: "https://ui.aceternity.com/_next/image?url=%2Fmanu.png&w=256&q=75",
      readTime: "3 min read"
    },
    content: {
      title: "Author Card 2",
      description: "Another news card description."
    }
  },
  {
    id: 4,
    backgroundImage: "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1651&q=80",
    author: {
      name: "Another Author",
      avatar: "https://ui.aceternity.com/_next/image?url=%2Fmanu.png&w=256&q=75",
      readTime: "3 min read"
    },
    content: {
      title: "Author Card 2",
      description: "Another news card description."
    }
  },
  {
    id: 5,
    backgroundImage: "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1651&q=80",
    author: {
      name: "Another Author",
      avatar: "https://ui.aceternity.com/_next/image?url=%2Fmanu.png&w=256&q=75",
      readTime: "3 min read"
    },
    content: {
      title: "Author Card 2",
      description: "Another news card description."
    }
  },
  // добавь ещё 2-3, чтобы было 4+ штук
]

export function NewsComponent() {
  return (
    <div className="container mx-auto px-4 ">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockData.map((item) => (
          <AuthorCard
            key={item.id}
            backgroundImage={item.backgroundImage}
            author={item.author}
            content={item.content}
          />
        ))}
      </div>
    </div>
  )
}
