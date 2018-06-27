import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Image from '@ckeditor/ckeditor5-image/src/image';
import {InsertImage} from "./plugins/InsertImage";
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import {InsertGallery} from "./plugins/InsertGallery";

ClassicEditor
  .create( document.querySelector( '#editor' ), {
    plugins: [ Essentials, Paragraph, Bold, Italic, Image, InsertImage, Widget, InsertGallery ],
    toolbar: [ 'bold', 'italic', 'insertImage', 'insertGallery' ]
  })
  .then( editor => {
    console.log( 'Editor was initialized', editor );

    document.getElementById("getData").addEventListener("click", () => {
      console.log(editor.getData());
    });
  })
  .catch( error => {
    console.error( error.stack );
  });

