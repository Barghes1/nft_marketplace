'use client';

import { useState, useEffect, useContext } from 'react';
import Image from 'next/image';

import { NFTContext } from '@/context/NFTContext';
import { NFTCard, Loader, Banner, SearchBar } from '@/components';
import images from '../../../assets';
import { shortenAddress } from '@/utils/shortenAddress';

const MyNFTs = () => {
    const { fetchMyNFTsOrListedNFTs, currentAccount } = useContext(NFTContext);
    const [nfts, setNfts] = useState([]);
    const [nftCopy, setNftCopy] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [activeSelect, setActiveSelect] = useState('Recently Added');

    useEffect(() => {
        fetchMyNFTsOrListedNFTs().then((items) => {
            setNfts(items);
            setNftCopy(items);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        const sortedNfts = [...nfts];

        switch (activeSelect) {
            case 'Price (low to high)':
                setNfts(sortedNfts.sort((a, b) => a.price - b.price));
                break;
            case 'Price (high to low)':
                setNfts(sortedNfts.sort((a, b) => b.price - a.price));
                break;
            case 'Recently added':
                setNfts(sortedNfts.sort((a, b) => b.tokenId - a.tokenId));
                break;
            default:
                setNfts(nfts);
                break;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSelect]);

    if (isLoading) {
        return (
            <div className="flexStart min-h-screen">
                <Loader />
            </div>
        );
    }

    const onHandleSearch = (value) => {
        const filteredNfts = nfts.filter(({ name }) =>
            name.toLowerCase().includes(value.toLowerCase()),
        );

        if (filteredNfts.length) {
            setNfts(filteredNfts);
        } else {
            setNfts(nftCopy);
        }
    };

    const onClearSearch = () => {
        if (nfts.length && nftCopy.length) {
            setNfts(nftCopy);
        }
    };

    return (
        <div className="w-full flex justify-start items-center flex-col min-h-screen">
            <div className="w-full flexCenter flex-col">
                <Banner
                    name="Your Nifty NFTs"
                    childStyles="text-center mb-4"
                    parentStyles="h-80 justify-center"
                />
                <div className="flexCenter flex-col -mt-20 z-0">
                    <div className="flexCenter w-40 h-40 sm:w-36 sm:h-36 p-1 bg-nft-black-1 rounded-full">
                        <Image
                            src={images.creator1}
                            className="rounded-full"
                            style={{ objectFit: 'cover' }}
                            alt="user image"
                        />
                    </div>
                    <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl mt-6">
                        {shortenAddress(currentAccount)}
                    </p>
                </div>
            </div>
            {!isLoading && nfts.length === 0 && !nftCopy.length ? (
                <div className="flexCenter sm:p-4 p-16">
                    <h1 className="font-poppins dark:text-white text-nft-black-1 text-3xl font-extrabold">
                        No NFTs owned
                    </h1>
                </div>
            ) : (
                <div className="sm:px-4 p-12 w-full minmd:w-4/5 flexCenter flex-col">
                    <div className="flex-1 w-full flex flex-row sm:flex-col px-4 xs:px-0 minlg:px-8">
                        <SearchBar
                            activeSelect={activeSelect}
                            setActiveSelect={setActiveSelect}
                            handleSearch={onHandleSearch}
                            clearSearch={onClearSearch}
                        />
                    </div>
                    <div className="mt-3 w-full flex flex-wrap">
                        {nfts.map((nft) => (
                            <NFTCard
                                key={nft.tokenId}
                                nft={nft}
                                onProfilePage
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyNFTs;
