/** @format */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, CheckboxControl } from 'newspack-components';
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { recordEvent } from 'lib/tracks';

/**
 * Internal depdencies
 */
import { getCountryCode } from 'dashboard/utils';
import { H, Card, Form } from '@woocommerce/components';
import withSelect from 'wc-api/with-select';
import {
	StoreAddress,
	validateStoreAddress,
} from '../../components/settings/general/store-address';

class StoreDetails extends Component {
	constructor() {
		super( ...arguments );

		this.initialValues = {
			addressLine1: '',
			addressLine2: '',
			city: '',
			countryState: '',
			postCode: '',
			isClient: false,
		};

		this.onContinue = this.onContinue.bind( this );
	}

	async onContinue( values ) {
		const {
			createNotice,
			goToNextStep,
			isSettingsError,
			updateSettings,
			updateProfileItems,
			isProfileItemsError,
		} = this.props;

		recordEvent( 'storeprofiler_store_details_continue', {
			store_country: getCountryCode( values.countryState ),
			setup_client: values.isClient,
		} );

		await updateSettings( {
			general: {
				woocommerce_store_address: values.addressLine1,
				woocommerce_store_address_2: values.addressLine2,
				woocommerce_default_country: values.countryState,
				woocommerce_store_city: values.city,
				woocommerce_store_postcode: values.postCode,
			},
		} );

		await updateProfileItems( { setup_client: values.isClient } );

		if ( ! isSettingsError && ! isProfileItemsError ) {
			goToNextStep();
		} else {
			createNotice(
				'error',
				__( 'There was a problem saving your store details.', 'woocommerce-admin' )
			);
		}
	}

	render() {
		return (
			<Fragment>
				<H className="woocommerce-profile-wizard__header-title">
					{ __( 'Where is your store based?', 'woocommerce-admin' ) }
				</H>
				<H className="woocommerce-profile-wizard__header-subtitle">
					{ __(
						'This will help us configure your store and get you started quickly',
						'woocommerce-admin'
					) }
				</H>

				<Card>
					<Form
						initialValues={ this.initialValues }
						onSubmitCallback={ this.onContinue }
						validate={ validateStoreAddress }
					>
						{ ( { getInputProps, handleSubmit } ) => (
							<Fragment>
								<StoreAddress getInputProps={ getInputProps } />
								<CheckboxControl
									label={ __( "I'm setting up a store for a client", 'woocommerce-admin' ) }
									{ ...getInputProps( 'isClient' ) }
								/>

								<Button isPrimary onClick={ handleSubmit }>
									{ __( 'Continue', 'woocommerce-admin' ) }
								</Button>
							</Fragment>
						) }
					</Form>
				</Card>
			</Fragment>
		);
	}
}

export default compose(
	withSelect( select => {
		const { getSettings, getSettingsError, isGetSettingsRequesting, getProfileItemsError } = select(
			'wc-api'
		);

		const settings = getSettings( 'general' );
		const isSettingsError = Boolean( getSettingsError( 'general' ) );
		const isSettingsRequesting = isGetSettingsRequesting( 'general' );
		const isProfileItemsError = Boolean( getProfileItemsError() );

		return { getSettings, isProfileItemsError, isSettingsError, isSettingsRequesting, settings };
	} ),
	withDispatch( dispatch => {
		const { createNotice } = dispatch( 'core/notices' );
		const { updateSettings, updateProfileItems } = dispatch( 'wc-api' );

		return {
			createNotice,
			updateSettings,
			updateProfileItems,
		};
	} )
)( StoreDetails );
