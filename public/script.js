document.getElementById('krakenForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const krakenLink = document.getElementById('krakenLink').value;
    
    const regex = /krakenfiles\.com\/view\/([a-zA-Z0-9]+)\/file\.html/;
    const match = krakenLink.match(regex);
    
    if (match && match[1]) {
        const id = match[1];
        
        const newLink = `https://krakenfiles.com/embed-audio/${id}?autoplay=false&link=true`;
        
        const shareLink = `${window.location.origin}/view/${id}`;
        document.getElementById('shareLinkUrl').href = shareLink;
        document.getElementById('shareLinkUrl').textContent = shareLink;
        document.getElementById('shareLink').style.display = 'block';
    } else {
        alert('Invalid KrakenFiles link');
    }
});

function copyToClipboard() {
    const link = document.getElementById('shareLinkUrl').href;
    navigator.clipboard.writeText(link).then(() => {
    });
}