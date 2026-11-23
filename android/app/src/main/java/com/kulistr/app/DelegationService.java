package com.kulistr.app;

import com.google.androidbrowserhelper.playbilling.digitalgoods.DigitalGoodsRequestHandler;

// Sitedeki Digital Goods API çağrılarını Google Play Billing'e bağlar, bildirimleri uygulama adına gösterir.
public class DelegationService extends com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();
        registerExtraCommandHandler(new DigitalGoodsRequestHandler(getApplicationContext()));
    }
}
