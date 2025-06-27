import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock Twitter API endpoints
  http.get("https://api.twitter.com/2/tweets/search/recent", () => {
    return HttpResponse.json({
      data: [
        {
          id: "1234567890",
          text: "Transfer news: Player X signs for Club Y #TransferMarket",
          created_at: "2024-01-01T12:00:00.000Z",
          author_id: "123456",
          public_metrics: {
            retweet_count: 10,
            like_count: 50,
            reply_count: 5,
          },
        },
      ],
      meta: {
        result_count: 1,
        newest_id: "1234567890",
        oldest_id: "1234567890",
      },
    });
  }),

  // Mock OpenAI API endpoints
  http.post("https://api.openai.com/v1/chat/completions", () => {
    return HttpResponse.json({
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1677652288,
      model: "gpt-4",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Mock Terry commentary about the transfer news.",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  }),

  // Mock internal API endpoints
  http.get("/api/feed", () => {
    return HttpResponse.json({
      items: [
        {
          id: "feed-item-1",
          type: "transfer",
          title: "Mock Transfer News",
          content: "Mock content for testing",
          timestamp: "2024-01-01T12:00:00.000Z",
          tags: ["#MockClub", "@MockPlayer"],
          source: "MockSource",
        },
      ],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
    });
  }),

  // Mock email subscription endpoint
  http.post("/api/email/subscribe", () => {
    return HttpResponse.json({
      success: true,
      message: "Successfully subscribed to newsletter",
    });
  }),
];
