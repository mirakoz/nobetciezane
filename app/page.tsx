'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

// Function to calculate distance between two coordinates using Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    var R = 6371; // Earth's radius (km)
    var dLat = (lat2 - lat1) * (Math.PI / 180);
    var dLon = (lon2 - lon1) * (Math.PI / 180);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return parseFloat(d.toFixed(1)); // Return as number with 1 decimal place
}

// Google AdSense component
const GoogleAd: React.FC<{
    slot: string;
    format?: string;
    responsive?: boolean;
    style?: React.CSSProperties;
    className?: string;
}> = ({ slot, format, responsive, style, className }) => {
    useEffect(() => {
        try {
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            (window as any).adsbygoogle.push({});
        } catch (error) {
            console.error('AdSense error:', error);
        }
    }, []);

    return (
        <div className={`ad-container ${className ? className : ''} mx-auto overflow-hidden`} data-oid="l3wb_5-">
            <ins
                className="adsbygoogle"
                style={style}
                data-ad-client="ca-pub-1754199822905338"
                data-ad-slot={slot}
                data-ad-format={format || 'auto'}
                data-full-width-responsive={responsive ? 'true' : 'false'}
                data-oid="wj85g5x"
            />
        </div>
    );
};

// Banner ad sizes
const AdSizes = {
    BANNER_DESKTOP: { width: '728px', height: '90px', display: 'inline-block' },
    BANNER_MOBILE: { width: '320px', height: '100px', display: 'inline-block' },
    RECTANGLE: { width: '300px', height: '250px', display: 'inline-block' },
    RESPONSIVE: { display: 'block' },
};

// Define a type for the pharmacy object
type Pharmacy = {
    pharmacyName: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
};

export default function Page() {
    // Load AdSense script
    useEffect(() => {
        const loadAdSenseScript = () => {
            const script = document.createElement('script');
            script.src =
                'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1754199822905338';
            script.async = true;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        };

        loadAdSenseScript();
    }, []);

    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [manualLocationMode, setManualLocationMode] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    const fetchPharmacies = async (latitude: number, longitude: number) => {
        try {
            const apiUrl = `https://www.nosyapi.com/apiv2/service/pharmacies-on-duty/locations?latitude=${latitude}&longitude=${longitude}`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    Authorization:
                        'Bearer Bh688nnEEhMJVchkjly1rw3dqj82DhZ0XN39QPyK6yxURlYD2sW8PC2OSJlI',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API yanıtı başarısız: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.data) {
                // Transform API response to our pharmacy format
                const pharmacyList = data.data.map((pharmacy: Pharmacy) => {
                    // Calculate distance using Haversine formula
                    const calculatedDistance = getDistanceFromLatLonInKm(
                        latitude,
                        longitude,
                        pharmacy.latitude,
                        pharmacy.longitude,
                    );

                    return {
                        name: pharmacy.pharmacyName,
                        address: pharmacy.address,
                        phone: pharmacy.phone,
                        latitude: pharmacy.latitude,
                        longitude: pharmacy.longitude,
                        distance: calculatedDistance, // number
                        isOpen: true,
                    };
                });

                // Sort pharmacies by distance (closest first)
                pharmacyList.sort((a: { distance: number }, b: { distance: number }) =>
                    a.distance - b.distance
                );

                setPharmacies(pharmacyList);
            } else {
                setError('Yakınınızda nöbetçi eczane bulunamadı.');
            }
        } catch (error) {
            console.error('API hatası:', error);
            setError('Eczane bilgileri alınamadı. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const getLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Tarayıcınız konum hizmetini desteklemiyor.');
            setLoading(false);
            setManualLocationMode(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLatitude = position.coords.latitude;
                const userLongitude = position.coords.longitude;

                setLocation({
                    latitude: userLatitude,
                    longitude: userLongitude,
                });

                // Fetch pharmacies from NosyAPI
                fetchPharmacies(userLatitude, userLongitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setError('Konum bilgisi alınamadı. Manuel konum seçebilirsiniz.');
                setLoading(false);
                setManualLocationMode(true);
            },
            { timeout: 10000, enableHighAccuracy: true },
        );
    };

    const handleManualSearch = () => {
        if (!selectedCity || !selectedDistrict) {
            setError('Lütfen şehir ve ilçe seçiniz.');
            return;
        }

        setLoading(true);
        setError(null);

        // For demo purposes, using mock data when manual location is selected
        // In a real app, you would make an API call with city/district parameters
        setTimeout(() => {
            // Mock user location based on selected city/district
            let userLat: number, userLon: number;

            if (selectedCity === 'İstanbul') {
                userLat = 41.0082;
                userLon = 28.9784;
            } else if (selectedCity === 'Ankara') {
                userLat = 39.9334;
                userLon = 32.8597;
            } else {
                userLat = 40.0;
                userLon = 29.0;
            }

            const mockPharmacies = [
                {
                    name: 'Ada Eczanesi',
                    address: `${selectedDistrict}, ${selectedCity}`,
                    phone: '0212555555',
                    latitude: userLat + 0.01,
                    longitude: userLon + 0.01,
                    isOpen: true,
                },
                {
                    name: 'Merkez Eczanesi',
                    address: `${selectedDistrict}, ${selectedCity}`,
                    phone: '0212666666',
                    latitude: userLat - 0.005,
                    longitude: userLon + 0.02,
                    isOpen: true,
                },
                {
                    name: 'Hayat Eczanesi',
                    address: `${selectedDistrict}, ${selectedCity}`,
                    phone: '0212777777',
                    latitude: userLat + 0.02,
                    longitude: userLon - 0.01,
                    isOpen: true,
                },
            ];

            const pharmaciesWithDistance = mockPharmacies.map((pharmacy) => {
                const distance = getDistanceFromLatLonInKm(
                    userLat,
                    userLon,
                    pharmacy.latitude,
                    pharmacy.longitude,
                );
                return {
                    ...pharmacy,
                    distance: distance, // number
                };
            });

            pharmaciesWithDistance.sort((a, b) => a.distance - b.distance);

            setPharmacies(pharmaciesWithDistance);
            setLocation({ latitude: userLat, longitude: userLon });
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white" data-oid="eo8o56k">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12" data-oid="-qkieb5">
                {!pharmacies.length ? (
                    <div className="text-center space-y-10" data-oid="u-kupu.">
                        <div className="space-y-4" data-oid="yeczz5w">
                            <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 mb-4 animate-fade-in tracking-tight" data-oid="m3mqyra">
                                Nöbetçi Eczane Bul
                            </h1>
                            <p className="text-xl md:text-2xl text-blue-700 mb-8 max-w-2xl mx-auto" data-oid="rf.btdq">
                                Size en yakın nöbetçi eczaneleri anında görüntüleyin.
                            </p>
                        </div>

                        {!manualLocationMode ? (
                            <div className="space-y-6" data-oid="jdhjj03">
                                <button
                                    onClick={getLocation}
                                    disabled={loading}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 text-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg rounded-[15px]"
                                    data-oid=":9th5j:"
                                >
                                    {loading ? (
                                        <span className="flex items-center" data-oid="xt28h8g">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-oid="7.-oafr">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" data-oid="lx_r8y2"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-oid="1:inqgp"></path>
                                            </svg>
                                            Konum Alınıyor...
                                        </span>
                                    ) : (
                                        'Konumumu Kullan'
                                    )}
                                </button>

                                <div data-oid="6.o2224">
                                    <button onClick={() => setManualLocationMode(true)} className="text-blue-600 hover:text-blue-800 font-medium underline" data-oid="eui-:ek">
                                        Manuel konum seçmek istiyorum
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-md mx-auto" data-oid="7:dr_su">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="-7cw1sp">
                                    <div data-oid="o_9fw.a">
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1 text-left" data-oid="m0enc79">
                                            Şehir
                                        </label>
                                        <select
                                            id="city"
                                            value={selectedCity}
                                            onChange={(e) => setSelectedCity(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            data-oid="6mpekxn"
                                        >
                                            <option value="" data-oid="yrvqei5">
                                                Şehir Seçin
                                            </option>
                                            <option value="İstanbul" data-oid="ql6n7e:">
                                                İstanbul
                                            </option>
                                            <option value="Ankara" data-oid="dapivd-">
                                                Ankara
                                            </option>
                                            <option value="İzmir" data-oid="-4kszua">
                                                İzmir
                                            </option>
                                            <option value="Bursa" data-oid="nswtxi4">
                                                Bursa
                                            </option>
                                            <option value="Antalya" data-oid="0xjk:79">
                                                Antalya
                                            </option>
                                        </select>
                                    </div>

                                    <div data-oid="e05mf1w">
                                        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1 text-left" data-oid="73c4clj">
                                            İlçe
                                        </label>
                                        <select
                                            id="district"
                                            value={selectedDistrict}
                                            onChange={(e) => setSelectedDistrict(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            disabled={!selectedCity}
                                            data-oid="d630d19"
                                        >
                                            <option value="" data-oid="6rlc1b9">
                                                İlçe Seçin
                                            </option>
                                            {selectedCity === 'İstanbul' && (
                                                <>
                                                    <option value="Kadıköy" data-oid="-3y29rw">
                                                        Kadıköy
                                                    </option>
                                                    <option value="Beşiktaş" data-oid="2r_-nug">
                                                        Beşiktaş
                                                    </option>
                                                    <option value="Şişli" data-oid="g2e5nv-">
                                                        Şişli
                                                    </option>
                                                    <option value="Üsküdar" data-oid="-65vd2.">
                                                        Üsküdar
                                                    </option>
                                                </>
                                            )}
                                            {selectedCity === 'Ankara' && (
                                                <>
                                                    <option value="Çankaya" data-oid="dgmtjs0">
                                                        Çankaya
                                                    </option>
                                                    <option value="Keçiören" data-oid="b3jlr-a">
                                                        Keçiören
                                                    </option>
                                                    <option value="Mamak" data-oid="xjrc53c">
                                                        Mamak
                                                    </option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex space-x-4 justify-center" data-oid="rvld5on">
                                    <button
                                        onClick={handleManualSearch}
                                        disabled={loading || !selectedCity || !selectedDistrict}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg rounded-lg"
                                        data-oid="hur6_pr"
                                    >
                                        {loading ? 'Aranıyor...' : 'Ara'}
                                    </button>

                                    <button
                                        onClick={() => setManualLocationMode(false)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg"
                                        data-oid="mhga4ol"
                                    >
                                        Konumumu Kullan
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-500 mt-4 font-medium" data-oid="4h9.d:_">
                                {error}
                            </p>
                        )}

                        {/* Banner Ad below the button */}
                        <div className="mt-12" data-oid="ccl445i">
                            {/* Desktop Banner Ad */}
                            <div className="hidden md:block" data-oid="dnzq0f_">
                                <script
                                    async
                                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1754199822905338"
                                    crossOrigin="anonymous"
                                    data-oid="d1_0q_l"
                                ></script>
                                <GoogleAd
                                    slot="1234567890"
                                    style={AdSizes.BANNER_DESKTOP}
                                    responsive={true}
                                    data-oid="2cta0s:"
                                />
                            </div>

                            {/* Mobile Banner Ad */}
                            <div className="block md:hidden" data-oid="fd1wybf">
                                <script
                                    async
                                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1754199822905338"
                                    crossOrigin="anonymous"
                                    data-oid="il6jhwj"
                                ></script>
                                <GoogleAd
                                    slot="6677889900"
                                    style={AdSizes.BANNER_MOBILE}
                                    data-oid="fsv3bd-"
                                />
                            </div>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-20" data-oid=":m4ntsl">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" data-oid="hhgpi80"></div>
                        <p className="text-xl text-blue-700 font-medium" data-oid="v7w7h94">
                            Nöbetçi eczaneler aranıyor...
                        </p>
                    </div>
                ) : (
                    <div data-oid=":-qem9o">
                        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-8 text-center" data-oid="_je1-nm">
                            Yakınınızdaki Nöbetçi Eczaneler
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-oid="az1k8mf">
                            {pharmacies.map((pharmacy, index) => {
                                // Insert ad after every 3 pharmacy cards
                                const pharmacyCard = (
                                    <div
                                        key={`pharmacy-${index}`}
                                        className="bg-white rounded-xl shadow-lg p-6 transform transition duration-300 hover:scale-105 hover:shadow-xl border border-gray-100"
                                        data-oid="rad_q:9"
                                    >
                                        <div className="flex justify-between items-start mb-3" data-oid="ks_61v5">
                                            <h3 className="text-xl font-bold text-blue-800" data-oid="dktpg02">
                                                {pharmacy.name}
                                            </h3>
                                            <span
                                                className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center"
                                                data-oid=":y2d5pj"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3 mr-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    data-oid="e7vj6_i"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                                        data-oid="6bshc_u"
                                                    />
                                                </svg>
                                                {pharmacy.distance.toFixed(1)} km
                                            </span>
                                        </div>

                                        <p className="text-gray-600 mb-4" data-oid="dxg8ff5">
                                            {pharmacy.address}
                                        </p>

                                        <div className="flex flex-col space-y-3" data-oid="2e37g68">
                                            <a
                                                href={`tel:${pharmacy.phone}`}
                                                className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors duration-200"
                                                data-oid="w4gtbxu"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-2"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    data-oid="2ef1r_u"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                        data-oid="-4k8_5c"
                                                    />
                                                </svg>
                                                {pharmacy.phone}
                                            </a>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.latitude},${pharmacy.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors duration-200"
                                                data-oid="7iw:g-2"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-2"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    data-oid=".c8ml1q"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                        data-oid="00d0aq8"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                        data-oid="cnn_3mn"
                                                    />
                                                </svg>
                                                Haritada Göster
                                            </a>
                                        </div>
                                    </div>
                                );

                                // Add an ad after every 3 pharmacy cards
                                if ((index + 1) % 3 === 0 && index !== pharmacies.length - 1) {
                                    return [
                                        pharmacyCard,
                                        <div
                                            key={`ad-${index}`}
                                            className="md:col-span-2 lg:col-span-3 my-4"
                                            data-oid="edotk-t"
                                        >
                                            <script
                                                async
                                                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1754199822905338"
                                                crossOrigin="anonymous"
                                                data-oid="0fwcgik"
                                            ></script>
                                            <GoogleAd
                                                slot="9876543210"
                                                style={AdSizes.RECTANGLE}
                                                data-oid="cfjybk2"
                                            />
                                        </div>,
                                    ];
                                }

                                return pharmacyCard;
                            })}
                        </div>

                        <button
                            onClick={() => {
                                setPharmacies([]);
                                setLocation(null);
                            }}
                            className="mt-10 mx-auto block bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-full transition-colors duration-200"
                            data-oid="9sa.ggi"
                        >
                            Yeni Arama
                        </button>

                        {/* Footer Ad */}
                        <div className="mt-16" data-oid="iw03v3b">
                            {/* Desktop Footer Ad */}
                            <div className="hidden md:block" data-oid="4:o-vic">
                                <script
                                    async
                                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1754199822905338"
                                    crossOrigin="anonymous"
                                    data-oid="rs.iu0a"
                                ></script>
                                <GoogleAd
                                    slot="1122334455"
                                    style={AdSizes.BANNER_DESKTOP}
                                    responsive={true}
                                    data-oid="u5cr1y7"
                                />
                            </div>

                            {/* Mobile Footer Ad */}
                            <div className="block md:hidden" data-oid="ewwvf71">
                                <script
                                    async
                                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1754199822905338"
                                    crossOrigin="anonymous"
                                    data-oid="ue05iof"
                                ></script>
                                <GoogleAd
                                    slot="6677889900"
                                    style={AdSizes.BANNER_MOBILE}
                                    data-oid="xbie7dq"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
