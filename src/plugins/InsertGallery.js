import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { downcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import {
  upcastAttributeToAttribute,
  upcastElementToElement
} from "@ckeditor/ckeditor5-engine/src/conversion/upcast-converters";
import ViewPosition from "@ckeditor/ckeditor5-engine/src/view/position";
import ModelPosition from "@ckeditor/ckeditor5-engine/src/model/position";
import {toWidget} from "@ckeditor/ckeditor5-widget/src/utils";

const GALLERY_NAME = "gallery";
const imageSymbol = Symbol( 'isImage' );

export class InsertGallery extends Plugin {
  init() {
    this.registerView();

    this.registerMenu();
  }

  registerView() {
    const editor = this.editor;
    const schema = editor.model.schema;
    const t = editor.t;
    const conversion = editor.conversion;

    // Configure schema.
    schema.register( GALLERY_NAME, {
      isObject: true,
      isBlock: true,
      allowWhere: '$block',
      allowAttributes: [ 'alt', 'src', 'srcset' ]
    } );

    conversion.for( 'dataDowncast' ).add( downcastElementToElement( {
      model: GALLERY_NAME,
      view: ( modelElement, viewWriter ) => this.createImageViewElement( viewWriter )
    } ) );

    conversion.for( 'editingDowncast' ).add( downcastElementToElement( {
      model: GALLERY_NAME,
      view: ( modelElement, viewWriter ) => this.toImageWidget( this.createImageViewElement( viewWriter ), viewWriter, t( 'image widget' ) )
    } ) );

    conversion.for( 'downcast' )
      .add( this.modelToViewAttributeConverter( 'src' ) )
      .add( this.modelToViewAttributeConverter( 'alt' ) )
      .add( this.srcsetAttributeConverter() );

    conversion.for( 'upcast' )
      .add( upcastElementToElement( {
        view: {
          name: 'img',
          attributes: {
            src: true
          }
        },
        model: ( viewImage, modelWriter ) => modelWriter.createElement( GALLERY_NAME, { src: viewImage.getAttribute( 'src' ) } )
      } ) )
      .add( upcastAttributeToAttribute( {
        view: {
          name: 'img',
          key: 'alt'
        },
        model: 'alt'
      } ) )
      .add( upcastAttributeToAttribute( {
        view: {
          name: 'img',
          key: 'srcset'
        },
        model: {
          key: 'srcset',
          value: viewImage => {
            const value = {
              data: viewImage.getAttribute( 'srcset' )
            };

            if ( viewImage.hasAttribute( 'width' ) ) {
              value.width = viewImage.getAttribute( 'width' );
            }

            return value;
          }
        }
      } ) )
      .add( this.viewFigureToModel() );
  }

  createImageViewElement( writer ) {
    const emptyElement = writer.createEmptyElement( 'img' );
    const figure = writer.createContainerElement( 'figure', { class: 'image' } );

    writer.insert( ViewPosition.createAt( figure ), emptyElement );

    return figure;
  }

  srcsetAttributeConverter() {
    return dispatcher => {
      dispatcher.on( 'attribute:srcset:gallery', converter );
    };

    function converter( evt, data, conversionApi ) {
      if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
        return;
      }

      const writer = conversionApi.writer;
      const figure = conversionApi.mapper.toViewElement( data.item );
      const img = figure.getChild( 0 );

      if ( data.attributeNewValue === null ) {
        const srcset = data.attributeOldValue;

        if ( srcset.data ) {
          writer.removeAttribute( 'srcset', img );
          writer.removeAttribute( 'sizes', img );

          if ( srcset.width ) {
            writer.removeAttribute( 'width', img );
          }
        }
      } else {
        const srcset = data.attributeNewValue;

        if ( srcset.data ) {
          writer.setAttribute( 'srcset', srcset.data, img );
          // Always outputting `100vw`. See https://github.com/ckeditor/ckeditor5-image/issues/2.
          writer.setAttribute( 'sizes', '100vw', img );

          if ( srcset.width ) {
            writer.setAttribute( 'width', srcset.width, img );
          }
        }
      }
    }
  }

  toImageWidget( viewElement, writer, label ) {
    writer.setCustomProperty( imageSymbol, true, viewElement );

    return toWidget( viewElement, writer, { label: labelCreator } );

    function labelCreator() {
      const imgElement = viewElement.getChild( 0 );
      const altText = imgElement.getAttribute( 'alt' );

      return altText ? `${ altText } ${ label }` : label;
    }
  }

  modelToViewAttributeConverter( attributeKey ) {
    return dispatcher => {
      dispatcher.on( `attribute:${ attributeKey }:gallery`, converter );
    };

    function converter( evt, data, conversionApi ) {
      if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
        return;
      }

      const viewWriter = conversionApi.writer;
      const figure = conversionApi.mapper.toViewElement( data.item );
      const img = figure.getChild( 0 );

      if ( data.attributeNewValue !== null ) {
        viewWriter.setAttribute( data.attributeKey, data.attributeNewValue, img );
      } else {
        viewWriter.removeAttribute( data.attributeKey, img );
      }
    }
  }

  viewFigureToModel() {
    return dispatcher => {
      dispatcher.on( 'element:figure', converter );
    };

    function converter( evt, data, conversionApi ) {
      // Do not convert if this is not an "image figure".
      if ( !conversionApi.consumable.test( data.viewItem, { name: true, classes: 'image' } ) ) {
        return;
      }

      // Find an image element inside the figure element.
      const viewImage = Array.from( data.viewItem.getChildren() ).find( viewChild => viewChild.is( 'img' ) );

      // Do not convert if image element is absent, is missing src attribute or was already converted.
      if ( !viewImage || !viewImage.hasAttribute( 'src' ) || !conversionApi.consumable.test( viewImage, { name: true } ) ) {
        return;
      }

      // Convert view image to model image.
      const conversionResult = conversionApi.convertItem( viewImage, data.modelCursor );

      // Get image element from conversion result.
      const modelImage = first( conversionResult.modelRange.getItems() );

      // When image wasn't successfully converted then finish conversion.
      if ( !modelImage ) {
        return;
      }

      // Convert rest of the figure element's children as an image children.
      conversionApi.convertChildren( data.viewItem, ModelPosition.createAt( modelImage ) );

      // Set image range as conversion result.
      data.modelRange = conversionResult.modelRange;

      // Continue conversion where image conversion ends.
      data.modelCursor = conversionResult.modelCursor;
    }
  }

  registerMenu() {
    this.editor.ui.componentFactory.add('insertGallery', locale => {
      const view = new ButtonView( locale );

      view.set({
        label: 'Gallery',
        withText: true,
        tooltip: true
      });

      // Callback executed once the image is clicked.
      view.on( 'execute', this.buttonOnClick.bind(this));

      return view;
    });
  }

  buttonOnClick() {
    const galleryName = prompt( 'Gallery' );

    this.editor.model.change( writer => {
      const galleryElement = writer.createElement( GALLERY_NAME, {
        'src': galleryName
      });

      // Insert the image in the current selection location.
      this.editor.model.insertContent( galleryElement, this.editor.model.document.selection );
    });
  }
}
