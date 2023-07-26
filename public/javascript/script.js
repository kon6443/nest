
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


function deleteArticle(article_id) {
    $.ajax({
        url: `/articles/${article_id}`,
        method: "DELETE",
        data: { },
        dataType: "json",
    })
        .done(function (data) {
            window.location.href = '/articles';
        })
        .fail(function (jqXHR) {
            const errorMessage = JSON.parse(jqXHR.responseText).message;
            alert(errorMessage);
        });
}

function postComment(article_id) {
    const content = document.getElementById('comment-text').value;
    if(content==='') {
        alert('Type something to save a comment.');
        return ;
    }
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

function deleteComment(id, depth) {
    $.ajax({
        url: `/articles/${id}/${depth}`,
        method: "DELETE",
        dataType: "json",
        success: function(res) {
            location.reload();
        },
        error: function(res) {
            alert(res);
        }
    });

}

function getEditingCommentFormat(id) {
    $.ajax({
        url: `/articles/comments/${id}`,
        method: "GET",
        dataType: "json",
        success: function(res) {
            const commentEdit = document.getElementById('commentEdit'+id);
            commentEdit.classList.toggle('hidden');
        },
        error: function(res) {
            alert('Invalid request.');
        }
    });
}

function putComment(comment_id) {
    const content = document.getElementById('comment-edit-content'+comment_id).value;
    $.ajax({
        url: `/articles/comments/${comment_id}`,
        method: "PUT",
        data: { content: content },
        dataType: "json",
        success: function(res) {
            alert(res.message);
            location.reload();
        },
        error: function(res) {
            alert('Invalid request.');
        }
    });
}

function createAccount() {
    const id = document.getElementById('signUpId').value;
    const name = document.getElementById('signUpName').value;
    const address = document.getElementById('signUpAddress').value;
    const phone_number = document.getElementById('signUpPhoneNumber').value;
    const pw = document.getElementById('signUpPassword').value;
    const pwc = document.getElementById('signUpPasswordConfirmation').value;
    $.ajax({
        url: `/user/new`,
        method: "POST",
        data: { id, name, address, phone_number, pw, pwc },
        dataType: "json",
        success: function(res) {
            alert(res.message);
            location.reload();
        },
        error: function(res) {
            alert('Invalid request.');
        }
    });
}

function signIn() {
    const id = document.getElementById('signInId').value;
    const pw = document.getElementById('signInPassword').value;
    $.ajax({
        url: `/user/login`,
        method: "POST",
        data: { id, pw },
        dataType: "json",
        success: function(data, textStatus, jqXHR) {
            location.reload();
        },
        error: function(res) {
            alert('Invalid request.');
        }
    });
}

function signOut() {
    $.ajax({
        url: `/user/logout`,
        method: "DELETE",
        dataType: "json",
        success: function(data, textStatus, jqXHR) {
            location.reload();
        },
        error: function(res) {
            alert('Invalid request.');
        }
    });
}


$("#signUpPasswordConfirmation").on("keyup", function () {
    if(window.event.keyCode==13 && $(this).val()!=""){
        createAccount();
    }
});

$("#signInPassword").on("keyup", function () {
    if(window.event.keyCode==13 && $(this).val()!=""){
        signIn();
    }
});

