export default function InlineTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inline JavaScript Test</h1>
      <div id="test-output">JavaScript not loaded</div>
      
      <script 
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const el = document.getElementById('test-output');
              if (el) {
                el.textContent = 'JavaScript is working!';
                el.style.color = 'green';
              }
              
              // Try to fetch the API
              fetch('/api/feed?limit=5')
                .then(res => res.json())
                .then(data => {
                  console.log('API Response:', data);
                  const resultEl = document.createElement('pre');
                  resultEl.style.marginTop = '20px';
                  resultEl.style.padding = '10px';
                  resultEl.style.backgroundColor = '#333';
                  resultEl.style.borderRadius = '5px';
                  resultEl.style.overflow = 'auto';
                  resultEl.textContent = JSON.stringify(data, null, 2);
                  document.querySelector('.p-8').appendChild(resultEl);
                })
                .catch(err => {
                  console.error('API Error:', err);
                });
            });
          `
        }}
      />
    </div>
  );
}