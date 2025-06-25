module.exports = {
  NextResponse: {
    json: (data, options = {}) => {
      return new Response(JSON.stringify(data), {
        status: options.status || 200,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    },
    redirect: (url, options = {}) => {
      return new Response(null, {
        status: options.status || 302,
        headers: {
          'Location': url,
          ...options.headers
        }
      });
    },
    rewrite: (url, options = {}) => {
      return new Response(null, {
        status: options.status || 200,
        headers: {
          'x-middleware-rewrite': url,
          ...options.headers
        }
      });
    }
  },
  NextRequest: global.Request
}; 