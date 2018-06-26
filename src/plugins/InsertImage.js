import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export class InsertImage extends Plugin {
  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add( 'insertImage', locale => {
      const view = new ButtonView( locale );

      view.set( {
        label: 'Insert image',
        icon: imageIcon,
        tooltip: true
      } );

      // Callback executed once the image is clicked.
      view.on( 'execute', () => {
        const imageURL = prompt( 'Image URL' );
      } );

      return view;
    } );
  }
}
