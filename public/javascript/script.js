
function postArticle() {
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    if(title==='') {
        alert('Type title please.');
        return ;
    }
    if(content==='') {
        alert('Type content please.');
        return ;
    }
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    $.ajax({
        url: "/articles/article",
        method: "POST",
        data: { title, content },
        dataType: "json",
        success: function(res) {
            console.log('res:', res);
        },
        error: function() {
            console.log("Request failed");
        }
    });
}

function deleteArticle(article_id, author) {
    console.log('article_id:', article_id);
    $.ajax({
        url: `/articles/${article_id}`,
        method: "DELETE",
        data: { id: article_id, author },
        dataType: "json",
        success: function(res) {
            console.log('res:', res);
        },
        error: function() {
            console.log("Request failed");
        }
    });
}
