'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

import { NFTContext } from '@/context/NFTContext';
import { Loader, Button, Input } from '@/components';

const ResellNFT = () => {
    const { createSale, isLoadingNFT } = useContext(NFTContext);
    const searchParams = useSearchParams();
    const tokenId = searchParams.get('tokenId');
    const tokenURI = searchParams.get('tokenURI');
    const router = useRouter();

    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');

    const fetchNFT = async () => {
        if (!tokenURI) return;

        const { data } = await axios.get(tokenURI);

        setPrice(data.price);
        setImage(data.image);
    };

    useEffect(() => {
        if (tokenURI) fetchNFT();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenURI]);

    console.log(tokenURI, price, tokenId);

    const resell = async () => {
        await createSale(tokenURI, price, true, tokenId);

        router.push('/');
    };

    if (isLoadingNFT) {
        return (
            <div className="flexStart min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex justify-center sm:px-4 p-12">
            <div className="w-3/5 md:w-full">
                <h1 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl">
                    Resell NFT
                </h1>

                <Input
                    inputType="number"
                    title="Price"
                    placeholder="NFT Price"
                    handleClick={(e) => setPrice(e.target.value)}
                />

                {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        className="rounded mt-4"
                        width={350}
                        alt="nfrImgForResell"
                    />
                )}

                <div className="mt-7 w-full flex justify-end">
                    <Button
                        btnName="List NFT"
                        classStyles="rounded-xl"
                        handleClick={resell}
                    />
                </div>
            </div>
        </div>
    );
};

export default ResellNFT;
