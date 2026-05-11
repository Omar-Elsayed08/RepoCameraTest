
var modal = $('#imageModal');
var modalImage = $('#imageModal-content');
var caption = $('#imageModal-caption');

$(".visual-art").click((event) => {
    var clickedImage = $(event.target);

    modalImage.addClass('in');
    modal.css('display', 'block');
    modalImage.attr('src', clickedImage.attr('src'));
    modalImage.attr('alt', clickedImage.attr('alt'));
    caption.text(clickedImage.attr('alt'));
    setTimeout(() => {
        modalImage.removeClass('in');
      }, 400);
});

var closeModal = () => {
    console.log('test');
    modalImage.addClass('out');
    setTimeout(() => {
        modal.css('display', 'none');
        modalImage.removeClass('out');
      }, 400);
}


$('span.close').click(() => {
    modalImage.addClass('out');
    setTimeout(() => {
        modal.css('display', 'none');
        modalImage.removeClass('out');
      }, 400);
});