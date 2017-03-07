( function ( mw ) {
	/**
	 * Wrapper for the RC form with hide/show links
	 * Must be constructed after the model is initialized.
	 *
	 * @extends OO.ui.Widget
	 *
	 * @constructor
	 * @param {mw.rcfilters.dm.FiltersViewModel} filtersModel Changes list view model
	 * @param {mw.rcfilters.dm.ChangesListViewModel} changeListModel Changes list view model
	 * @param {mw.rcfilters.Controller} controller RCfilters controller
	 * @param {jQuery} $formRoot Root element of the form to attach to
	 * @param {Object} config Configuration object
	 */
	mw.rcfilters.ui.FormWrapperWidget = function MwRcfiltersUiFormWrapperWidget( filtersModel, changeListModel, controller, $formRoot, config ) {
		config = config || {};

		// Parent
		mw.rcfilters.ui.FormWrapperWidget.parent.call( this, $.extend( {}, config, {
			$element: $formRoot
		} ) );
		// Mixin constructors
		OO.ui.mixin.PendingElement.call( this, config );

		this.changeListModel = changeListModel;
		this.filtersModel = filtersModel;
		this.controller = controller;
		this.$submitButton = this.$element.find( 'form input[type=submit]' );

		this.$element
			.on( 'click', 'a[data-params]', this.onLinkClick.bind( this ) );

		this.$element
			.on( 'submit', 'form', this.onFormSubmit.bind( this ) );

		// Events
		this.changeListModel.connect( this, {
			invalidate: 'onChangesModelInvalidate',
			update: 'onChangesModelUpdate'
		} );

		// Initialize
		this.cleanUpFieldset();
		this.$element
			.addClass( 'mw-rcfilters-ui-FormWrapperWidget' );
	};

	/* Initialization */

	OO.inheritClass( mw.rcfilters.ui.FormWrapperWidget, OO.ui.Widget );
	OO.mixinClass( mw.rcfilters.ui.FormWrapperWidget, OO.ui.mixin.PendingElement );

	/**
	 * Respond to link click
	 *
	 * @param {jQuery.Event} e Event
	 * @return {boolean} false
	 */
	mw.rcfilters.ui.FormWrapperWidget.prototype.onLinkClick = function ( e ) {
		this.controller.updateChangesList( $( e.target ).data( 'params' ) );
		return false;
	};

	/**
	 * Respond to form submit event
	 *
	 * @param {jQuery.Event} e Event
	 * @return {boolean} false
	 */
	mw.rcfilters.ui.FormWrapperWidget.prototype.onFormSubmit = function ( e ) {
		var data = {};

		// Collect all data from form
		$( e.target ).find( 'input:not([type="hidden"],[type="submit"]), select' ).each( function () {
			if ( !$( this ).is( ':checkbox' ) || $( this ).is( ':checked' ) ) {
				data[ $( this ).prop( 'name' ) ] = $( this ).val();
			}
		} );

		this.controller.updateChangesList( data );
		return false;
	};

	/**
	 * Respond to model invalidate
	 */
	mw.rcfilters.ui.FormWrapperWidget.prototype.onChangesModelInvalidate = function () {
		this.pushPending();
		this.$submitButton.prop( 'disabled', true );
	};

	/**
	 * Respond to model update, replace the show/hide links with the ones from the
	 * server so they feature the correct state.
	 *
	 * @param {jQuery|string} $changesList Updated changes list
	 * @param {jQuery} $fieldset Updated fieldset
	 */
	mw.rcfilters.ui.FormWrapperWidget.prototype.onChangesModelUpdate = function ( $changesList, $fieldset ) {
		this.$submitButton.prop( 'disabled', false );

		// Replace the entire fieldset
		this.$element.empty().append( $fieldset.contents() );

		this.cleanUpFieldset();

		this.popPending();
	};

	/**
	 * Clean up the old-style show/hide that we have implemented in the filter list
	 */
	mw.rcfilters.ui.FormWrapperWidget.prototype.cleanUpFieldset = function () {
		var widget = this;

		// HACK: Remove old-style filter links for filters handled by the widget
		// Ideally the widget would handle all filters and we'd just remove .rcshowhide entirely
		this.$element.find( '.rcshowhide' ).children().each( function () {
			// HACK: Interpret the class name to get the filter name
			// This should really be set as a data attribute
			var i,
				name = null,
				// Some of the older browsers we support don't have .classList,
				// so we have to interpret the class attribute manually.
				classes = this.getAttribute( 'class' ).split( ' ' );
			for ( i = 0; i < classes.length; i++ ) {
				if ( classes[ i ].substr( 0, 'rcshow'.length ) === 'rcshow' ) {
					name = classes[ i ].substr( 'rcshow'.length );
					break;
				}
			}
			if ( name === null ) {
				return;
			}
			if ( name === 'hidemine' ) {
				// HACK: the span for hidemyself is called hidemine
				name = 'hidemyself';
			}

			// This span corresponds to a filter that's in our model, so remove it
			if ( widget.filtersModel.getItemByName( name ) ) {
				// HACK: Remove the text node after the span.
				// If there isn't one, we're at the end, so remove the text node before the span.
				// This would be unnecessary if we added separators with CSS.
				if ( this.nextSibling && this.nextSibling.nodeType === Node.TEXT_NODE ) {
					this.parentNode.removeChild( this.nextSibling );
				} else if ( this.previousSibling && this.previousSibling.nodeType === Node.TEXT_NODE ) {
					this.parentNode.removeChild( this.previousSibling );
				}
				// Remove the span itself
				this.parentNode.removeChild( this );
			}
		} );
	};
}( mediaWiki ) );
