
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
            window.location.href = `/articles/${res.id}`;
        },
        error: function(res) {
            alert(res);
        }
    });
}

function putArticle(article_id) {
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    $.ajax({
        url: `/articles/${article_id}`,
        method: "PUT",
        data: { title, content },
        dataType: "json",
        success: function(res) {
            alert(res.message);
            window.location.href = `/articles/${article_id}`;
        },
        error: function(res) {
            alert('error: ' + JSON.stringify(res));
        }
    });
}


function deleteArticle(article_id, author) {
    $.ajax({
        url: `/articles/${article_id}`,
        method: "DELETE",
        data: { id: article_id, author },
        dataType: "json",
        success: function(res) {
            window.location.href = '/articles';
        },
        error: function(res) {
            alert(res);
        }
    });
}

function postComment(article_id) {
    const content = document.getElementById('comment-text').value;
    $.ajax({
        url: `/articles/${article_id}`,
        method: "POST",
        data: { content },
        dataType: "json",
        success: function(res) {
            location.reload();
        },
        error: function(res) {
            alert(res);
        }
    });
}

