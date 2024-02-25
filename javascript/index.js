(() => {

  const INIT_APPLICATION = () => {
    let App = null;

    const ELEMENTS_TYPES = window.PROMPT_GENERATOR_BASE_DB || {
      artists: {
        link: '../db/artists.txt',
        template: 'varTemplate1',
      },
      flavors:  {
        link: '../db/flavors.txt',
        template: 'varTemplate1',
      },
      mediums:  {
        link: '../db/mediums.txt',
        template: 'varTemplate1',
      },
      movements:  {
        link: '../db/movements.txt',
        template: 'varTemplate1',
      },
      male:  {
        link: '../db/random.male.txt',
        template: 'varTemplate1',
      },
      female:  {
        link: '../db/random.female.txt',
        template: 'varTemplate1',
      },
      item:  {
        link: '../db/item.txt',
        template: 'varTemplate1',
      },
      atmosphere:  {
        link: '../db/atmosphere.txt',
        template: 'varTemplate1',
      },
      activity:  {
        link: '../db/activity.txt',
        template: 'varTemplate1',
      },
      custom:  {
        template: 'varTemplate2',
      },
      coma:  {
        template: 'varTemplate3',
      },
    };
    
    class LS {
      constructor(){ this.key = 'WP:current'; }
    
      get( key ){
        if( !key ){
          const itemString =  localStorage.getItem( this.key );
          if( itemString  ){
            return JSON.parse( itemString );
           } else return [];
        } else {
          const itemString =  localStorage.getItem( key );
          if( itemString ){
            return itemString;
          } else {
            return null;
          }
        }
      }
    
      set( data, key ){
        if( !key ){
          const asString = JSON.stringify( data );
          localStorage.setItem( this.key, asString );
        } else {
          localStorage.setItem( key, data );
        }
      }
    
      remove( key ){
        localStorage.removeItem( key );
      }
    
    }
    
    const _LS = new LS();
    
    const RIGHT_DRAGGED_CLASS = 'dragged_on_right';
    const LEFT_DRAGGED_CLASS = 'dragged_on_left';
    class GenPromptModule {
    
      constructor( elementType, getApi ){
        this._getApi = getApi;
        this.type = elementType;
        this.templateID = null;
        this.element = null;
        this.textArea = null;
        this.removeButton = null;
        this.mouseMoveEvent = null;
        this.dropPosition = null;
        this.init();
      }
    
    
      get api(){ return this._getApi(); }
    
      get serialised(){
        const nextData = { type: this.type };
        if( this.type === 'custom' ) {
          nextData.text = this.textArea.value;
        } else if( this.text ){
          nextData.text = this.text;
        }
        return nextData;
      }
    
      install( serialisedData ){
        if( this.type === serialisedData.type ){
          if( this.type === 'custom' ){
            this.text = serialisedData.text;
            this.textArea.value = this.text;
          } else if( serialisedData.text ){
            this.text = serialisedData.text;
          }
        } else {
          console.warn( serialisedData.type + ' is not the same to this module type - ' + this.type );
        }
      }
    
      enableDraggedClasses(){
        if(  this.dropPosition ){
          if( this.dropPosition === 'left' ){
            this.element.classList.add( LEFT_DRAGGED_CLASS );
            this.element.classList.remove( RIGHT_DRAGGED_CLASS );
          } else if( this.dropPosition === 'right' ) {
            this.element.classList.add( RIGHT_DRAGGED_CLASS );
            this.element.classList.remove( LEFT_DRAGGED_CLASS );
          }
        }
      }
    
      disableDraggedClasses(){
        this.element.classList.remove( RIGHT_DRAGGED_CLASS );
        this.element.classList.remove( LEFT_DRAGGED_CLASS );
        this.dropPosition = null;
      }
    
      enableHighliteSpan(){
        this.spanTextElement.classList.add('hovered_control_element');
      }
    
      disableHighlightSpan(){
        this.spanTextElement.classList.remove('hovered_control_element');
      }
    
      calculateDropPosition( mouseEvent ){
        const dragged = this.api.draggedModuleExists();
        if( dragged && dragged.module !== this ){
          const boxRectangle = this.element.getBoundingClientRect();
          const dropAlpha = ( mouseEvent.clientX - boxRectangle.left ) / boxRectangle.width;
          this.dropPosition = dropAlpha > 0.5 ? 'right' : 'left';
        } else {
          this.dropPosition = null;
        }
      }
    
      init(){
    
    
        if( !( this.type in ELEMENTS_TYPES ) ){
          throw new Error( this.type + ' is not available prompt_module type');
        }
        this.templateID = ELEMENTS_TYPES[ this.type ].template;
        const template = document.getElementById( this.templateID );
        if( template ){
          this.element = template.cloneNode( true );
          this.element.id = '';
        }
    
        // const test = this.spanText;
        this.element.addEventListener('mouseenter', ( e ) => {
          this.mouseMoveEvent = e;
          this.enableHighliteSpan();
          this.api.enterModule({ module: this, mouse: e });
        });
        this.element.addEventListener('mousemove', ( e ) => {
          this.mouseMoveEvent = e;
          this.calculateDropPosition( e );
          this.enableHighliteSpan();
          this.enableDraggedClasses();
          this.api.overModule({ module: this, mouse: e });
        });
        this.element.addEventListener('mouseleave', () => {
          this.mouseMoveEvent = null;
          this.disableHighlightSpan();
          this.disableDraggedClasses();
          this.api.leaveModule();
        });
        this.element.addEventListener('mousedown', ( e ) => {
          this.mouseMoveEvent = null;
          this.api.startDrag( { module: this, mouse: e } );
        });
        this.element.addEventListener('mouseup', ( e ) => {
          this.mouseMoveEvent = null;
          const dropPosition = this.dropPosition;
          this.api.endDrag( { module: this, mouse: e, dropPosition } );
          this.disableHighlightSpan();
          this.disableDraggedClasses();
        });
        
        if( this.type != 'custom' && this.type != 'coma' ){
          this.element.addEventListener( 'click', () => {
            this.api.changeModuleContent( this );
          } );
          this.element.title = 'click to roll module content';
        }
        if( this.type === 'custom' ){
          // console.log( this );
          this.textArea = this.element.getElementsByClassName('gen_module_textarea')[0];
          this.textArea.oninput = ( e ) => {
            this.text = this.textArea.value;
            this.api.updatePrompt();
          }
        }
        this.removeButton = this.element.getElementsByClassName('mRemove')[0];
        if( this.type != 'custom' && this.type != 'coma' ){
          const text = document.createTextNode( this.type );
          this.removeButton.before( text );
        }
        this.removeButton.onclick = () => {
          this.api.removeElement( this );
        }
      }
    
      get spanText(){
        let textValue = '';
        if( this.text ){
          textValue = this.text;
          textValue = textValue.replace('\n', '');
          textValue = textValue.replace('\r', '');
        } else if( this.type === 'coma'){
          textValue = ',';
        }
        const spanE = document.createElement('sapn');
        spanE.innerText = ' ' + textValue;
        spanE.className = 'text_part_span';
        this.spanTextElement = spanE;
        return this.spanTextElement;
      }
    
      remove(){
        this.element.parentNode.removeChild( this.element );
      }
    
    }
    
    class GenPrompt {
    
      constructor(){
        this.elements = [];
        this.prompt_field_element = null;
        this.modules_line_element = null;
        this.generate_button = null;
    
        this.prompt = '';
    
        this.db = {};
        this.localStoredDatasets = [];
    
        this.currentModuleOver = null;
    
        this.currentModuleDragged = null;
    
        this.CUSTOM_DB_NAME = 'PromptGen:CustomDB';
    
        for( const nextElementName in ELEMENTS_TYPES ){
          const nextElement = ELEMENTS_TYPES[ nextElementName ];
          if( nextElement.link ){
            this.db[ nextElementName ] = [];
          }
        }
    
        this.init();
      }
    
      get api(){
        return {
          updatePrompt: () => {
            this.presetPrompt();
          },
          removeElement: ( gen_module ) => {
            this.removeElement( gen_module );
          },
          changeModuleContent: ( gen_module ) => {
            this.resetModulesRandomly( gen_module );
            this.prompt = document.getElementById('b34t_prompt').innerText;
            // this.presetPrompt();
          },
          enterModule: ( data )=>{
            this.currentModuleOver = data;
          }, 
          overModule:  ( data )=>{
            this.currentModuleOver = data;
            if( this.currentModuleDragged ){
              this.api.moveDrag();
            }
          },
          draggedModuleExists: () => {
            return this.currentModuleDragged;
          },
          leaveModule: () => {
            this.currentModuleOver = null;
          },
          startDrag: ( data ) => {
            this.currentModuleDragged = data;
          },
          moveDrag: () => { },
          endDrag: ( data ) => {
            const mOver = this.currentModuleOver;
            const mDragged = this.currentModuleDragged;
            if( mOver && mDragged && mOver.module !== mDragged.module ){
              const nextElements = [];
              let positionChanged = false;
              for( const nextEl of this.elements ){
                if( nextEl === mDragged.module ){ } 
                else if( nextEl === mOver.module ){
                  if( data.dropPosition === 'left' ){
                    nextElements.push( mDragged.module );
                    nextElements.push( nextEl );
                    positionChanged = true;
                  } else if( data.dropPosition === 'right' ){
                    nextElements.push( nextEl );
                    nextElements.push( mDragged.module );
                    positionChanged = true;
                  }
                } else {
                  nextElements.push( nextEl );
                }
              }
              this.currentModuleDragged = null;
              if( positionChanged ){
                this.elements = nextElements;
                this.render();
              }
            }
          },
          disableDragging: () => {
            if( this.currentModuleDragged ){
              this.currentModuleDragged.module.disableDraggedClasses();
            }
            if( this.currentModuleOver ){
              this.currentModuleOver.module.disableDraggedClasses();
            }
          }
        };
      }
    
      serialiseElements(){
        let resultData = [];
        for( const nextElement of this.elements ){
          resultData.push( nextElement.serialised );
        }
        return resultData;
      }
    
      elementsToLS(){
        _LS.set( this.serialiseElements() );
      }
    
      prepareCustomDataset( type, stringData ){
        return new Promise( ( resolve, reject )=>{
          const fr = new FileReader();
          fr.onload = () => {
            const link = fr.result;
            const nextData = {
              type,
              link,
              template: 'varTemplate1',
            };
            resolve( nextData );
          };
          fr.readAsDataURL( new File( [ stringData ], { type: 'text/plain' } ) );
        } );
      }
      
      get dateNow(){
        const date = new Date();
        let year = date.getFullYear();
        let month = ( date.getMonth() + '' ).length === 1 ? '0' + ( date.getMonth() + 1 ) : date.getMonth() + 1;
        let day = ( date.getDate() + '' ).length === 1 ? '0' + date.getDate(): date.getDate();
        let hours = ( date.getHours() + '' ).length === 1 ? '0' + date.getHours(): date.getHours();
        let minutes = ( date.getMinutes() + '' ).length === 1 ? '0' + date.getMinutes(): date.getMinutes();
        let seconds = ( date.getSeconds() + '' ).length === 1 ? '0' + date.getSeconds(): date.getSeconds();
        const combined_string = `${year}${month}${day}-${hours}${minutes}${seconds}`;
        return combined_string;
      }
    
      saveWorkflow(){
        const nextWorkflowForSave = {
          time: Date.now(),
          type: 'promptGenWorkflow',
          elements: this.serialiseElements(),
          datasets: JSON.parse(JSON.stringify( this.localStoredDatasets )),
        };
        const a = document.getElementById("save_workflow");
        const file = new Blob([ JSON.stringify( nextWorkflowForSave, null, 2 ) ], { type: 'application/json' });
        a.href = URL.createObjectURL(file);
        a.download = this.dateNow+'_workflow.json';
      }
    
      loadWorkflow( workflowJSON ){
        if( workflowJSON.type && workflowJSON.type === 'promptGenWorkflow' ){
          const elements = workflowJSON.elements;
          _LS.set( elements );
          const datasets = workflowJSON.datasets;
          this.localStoredDatasets = datasets;
          this.saveLocalStoredDataSets();
          window.location.reload();
        }
      }
    
      installCustomDataset( dataset ){
        const nextDataSetName = prompt('input short name for next dataset');
        if( nextDataSetName ){
          if( nextDataSetName in ELEMENTS_TYPES ){
            alert('Element ready used, please start load again and chose another name');
          } else {
            this.prepareCustomDataset( nextDataSetName, dataset ).then( ( datasetForSave ) => {
              this.localStoredDatasets.push( datasetForSave );
              this.saveLocalStoredDataSets();
              this.resetCustomDatasets();
              // window.location.reload();
            } );
          }
        }
      }
    
      saveLocalStoredDataSets(){
        // console.log( this.localStoredDatasets );
        _LS.set( JSON.stringify( this.localStoredDatasets ), this.CUSTOM_DB_NAME );
      }
    
      loadLocalStoredDataSets(){
        const customrDataset = _LS.get( this.CUSTOM_DB_NAME );
        if( customrDataset ){
          return JSON.parse( _LS.get( this.CUSTOM_DB_NAME ) );
        }
      }
    
      uninstallCustomDataset( keyName ){
        const elementsAfterUninstall = [];
        for( const nextElement of this.elements ){
          if( nextElement.type === keyName ){
    
          } else {
            elementsAfterUninstall.push( nextElement );
          }
        }
        this.elements = elementsAfterUninstall;
        this.elementsToLS();
    
        const customDatasetsAfterUninstall = [];
        for( const nextDataSet of this.localStoredDatasets ){
          if( nextDataSet.type === keyName ){
    
          } else {
            customDatasetsAfterUninstall.push( nextDataSet );
          }
        }
        this.localStoredDatasets = customDatasetsAfterUninstall;
        this.saveLocalStoredDataSets();
        this.resetCustomDatasets();
        // window.location.reload();
      }
    
      createCustomDatasetButton( datasetName ){
        const nextButton = document.createElement('button');
        nextButton.className = 'mbutton';
        nextButton.value = 'add_' + datasetName;
        nextButton.innerText = '+ ' + datasetName;
        const removeSpan = document.createElement('span');
        removeSpan.className = 'removeDatasetButton';
        removeSpan.innerText = 'x';
        nextButton.appendChild( removeSpan );
        return { button: nextButton, remove: removeSpan };
      }

      resetCustomDatasets(){
            
        const custom_data_container = document.getElementById('custom_datasets');

        custom_data_container.innerHTML = "";
    
        if( this.localStoredDatasets && this.localStoredDatasets.length ){
          for( const nextDataSet of this.localStoredDatasets ){
            ELEMENTS_TYPES[ nextDataSet.type ] = nextDataSet;
            const { button, remove } = this.createCustomDatasetButton( nextDataSet.type );
            remove.addEventListener( 'click', ( e ) => {
              e.preventDefault();
              e.stopPropagation();
              if( confirm('do you whant to delete this dataset and elements of it?') ){
                this.uninstallCustomDataset( nextDataSet.type );
                // console.log('try to delete');
              }
            });
            custom_data_container.appendChild( button );
          }
        }
        
      }
    
      init(){
    
        document.body.addEventListener( 'mouseup', () => {
          for( const element of this.elements ){
            element.disableDraggedClasses();
          }
          this.currentModuleDragged = null;
        } );
        document.body.addEventListener( 'mousemove', () => {
          if( this.currentModuleDragged ){
            document.body.style = 'cursor: grabbing !important';
          } else {
            document.body.style = '';
          }
        } );
        
        const localStoredDatasets = this.loadLocalStoredDataSets() || [];
    
        this.localStoredDatasets = localStoredDatasets; 
    
        this.prompt_field_element = document.getElementById('b34t_prompt');
        this.modules_line_element = document.getElementById('modules_line_element');
        this.generate_button = document.getElementById('generate');

        this.resetCustomDatasets();
        
        // const custom_data_container = document.getElementById('custom_datasets');
    
        // if( localStoredDatasets && this.localStoredDatasets.length ){
        //   for( const nextDataSet of this.localStoredDatasets ){
        //     ELEMENTS_TYPES[ nextDataSet.type ] = nextDataSet;
        //     const { button, remove } = this.createCustomDatasetButton( nextDataSet.type );
        //     remove.addEventListener( 'click', ( e ) => {
        //       e.preventDefault();
        //       e.stopPropagation();
        //       if( confirm('do you whant to delete this dataset and elements of it?') ){
        //         this.uninstallCustomDataset( nextDataSet.type );
        //         // console.log('try to delete');
        //       }
        //     });
        //     custom_data_container.appendChild( button );
        //   }
        // }
    
        for( const nextKey in ELEMENTS_TYPES ){
          if( ELEMENTS_TYPES[ nextKey ].link ){
            try{
              fetch( ELEMENTS_TYPES[ nextKey ].link ).then( ( _file ) => {
                _file.text().then( ( result ) => {
                  const asArray = result.split('\n');
                  this.db[ nextKey ] = asArray;
                } );
            }, ( err ) => { console.warn( ELEMENTS_TYPES, nextKey, err ); } );
            } catch( err ){
              console.warn( nextKey, err );
            }
          }
        }
    
        const getReadyItems = _LS.get();
    
        this.elements = [];
    
        if( getReadyItems.length ){
          for( const nextItem of getReadyItems ){
            if( nextItem.type in ELEMENTS_TYPES ){
              const nextElement = new GenPromptModule( nextItem.type, ()=>{ return this.api } );
              nextElement.install( nextItem );
              this.elements.push( nextElement );
            } else {
              console.warn( `${ nextItem.type } is not available, or dataset is loosen` );
            }
          }
          // rebuild from local storage
        }
      
        this.render();
      }
    
      onClick( clickedElement ){
        const _val = clickedElement.value;
        const forCheck = _val.replace('add_', '');
        if( _val ){
          if( forCheck in ELEMENTS_TYPES ){
            this.addElement( forCheck );
          } else if( _val === 'generate_prompt') {
            this.resetModulesRandomly();
            this.presetPrompt();
          } else if( _val === 'copy_to_clipboard') {
            this.removeElement( clickedElement );
          }
        }
      }
    
      copyPromptToClipboard(){
        navigator.clipboard.writeText( this.prompt );
      }
    
      removeElement( gen_module_for_remove ){
        const nextModules = [];
        for( const nextElement of this.elements ){
          if( nextElement !== gen_module_for_remove ){
            nextModules.push( nextElement );
          } else {
            this.modules_line_element.removeChild( gen_module_for_remove.element );
          }
        }
        this.elements = nextModules;
        this.render();
      }
    
      addElement( elementType ){
        const nextElement = new GenPromptModule( elementType, ()=>{ return this.api } );
        this.elements.push( nextElement );
        this.render();
      }
    
      getRandomString( dataName ){
        if( dataName in this.db ){
          const arrForRandom = this.db[ dataName ];
          const randomElement = arrForRandom[ Math.floor( arrForRandom.length * Math.random() ) ];
          return randomElement;
        }
        return '';
      }
    
      resetModulesRandomly( onlyThisModule ){
        for( const nextModule of this.elements ){
          if( onlyThisModule ){
            if( nextModule === onlyThisModule ){
              nextModule.text = this.getRandomString( nextModule.type );
              const moduleTextSpanElement = nextModule.spanTextElement;
              const nextSpan = nextModule.spanText;
              moduleTextSpanElement.after( nextSpan );
              moduleTextSpanElement.parentNode.removeChild( moduleTextSpanElement );
              this.elementsToLS();
            }
          } else {
            if( nextModule.type in this.db ){
              nextModule.text = this.getRandomString( nextModule.type );
            }
          }
        }
      }
    
      presetPrompt(){
        let promptData = ''; 
        this.prompt_field_element.innerHTML = '';
        for( const nextModule of this.elements ){
          if( nextModule.type in this.db ){
            if(!nextModule.text){
              nextModule.text = this.getRandomString( nextModule.type );
            }
    
            promptData += nextModule.text + ' ';
          } else if( nextModule.type === 'coma'){
            promptData += ', ';
          } else if( nextModule.type === 'custom'){
            promptData += nextModule.textArea.value + ' ';
          }
          const spanText = nextModule.spanText;
          if( spanText ){
            this.prompt_field_element.appendChild ( spanText );
          }
        }
        this.prompt = promptData;
        this.elementsToLS();
      }
    
      render(){
        if(!this.modules_line_element) return false;
        this.modules_line_element.innerHTML = '';
        for( const nextModule of this.elements ){
          this.modules_line_element.appendChild( nextModule.element );
        }
        this.presetPrompt();
      }
    
    }
    
    
    window.onload = () => { 
      
    }
    
    App = new GenPrompt();
    
    const tempInput = document.getElementById('installCustomDataset');
    tempInput.customListener = ()=>{};
    tempInput.addEventListener('change', ( e ) => {
      const nextTXTDATASET = tempInput.files[0];
      if(!nextTXTDATASET){ return false; }
      const nfr = new FileReader();
      nfr.onload = () => {
        App.installCustomDataset( nfr.result );
        tempInput.files = null;
      };
      nfr.readAsText( nextTXTDATASET );
    });
    
    const saveButton = document.getElementById('save_workflow');
    saveButton.addEventListener('click', () => {
      App.saveWorkflow();
    });
  
    const load_workflow_input = document.getElementById('load_workflow_input');
    load_workflow_input.addEventListener('change', ( e ) => {
      const nextTXTDATASET = load_workflow_input.files[0];
      if(!nextTXTDATASET){ return false; }
      const nfr = new FileReader();
      nfr.onload = () => {
        let asJSON = null;
        try{
          asJSON = JSON.parse( nfr.result );
        } catch( err ){}
        if( asJSON )App.loadWorkflow( asJSON );
        tempInput.files = null;
      };
      nfr.readAsText( nextTXTDATASET );
    });
  
  
    const elementsMButtons = document.querySelectorAll('.mbutton');
    for( const nextE of elementsMButtons ){
      nextE.addEventListener('click', ( e ) => {
        App.onClick( e.target ); 
      });
    }
  
    const copyClipboard  = ( txt ) => {
      var inp = document.createElement('input');
      document.body.appendChild(inp);
      inp.value = txt;
      inp.select();
      document.execCommand('copy',false);
      inp.remove();
    }
  
    document.getElementById("copy_clipboard").addEventListener( 'click', () => {
      const prompt = App.prompt.replaceAll( '\r', '' );
      copyClipboard( prompt );
    });
  
  
    document.getElementById("send_to_a111_prompt").addEventListener( 'click', () => {
      const prompt = App.prompt.replaceAll( '\r', '' );
      const prompt_container = document.getElementById('txt2img_prompt');
      const textInput = prompt_container.querySelector('textarea');
      textInput.value = prompt;
      textInput.dispatchEvent( new Event( 'input' ) );
    });

    window.eClick = ( e ) => { if( App ){ App.onClick( e ); } }

  }

  let inter = null;
  inter = setInterval( () => {
    if( window.PROMPT_GENERATOR_BASE_DB && document.getElementById(`b34t_gen_outer_container`) ){
      INIT_APPLICATION();
      clearInterval( inter );
    }
  } );

})()
