'use client';

import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';

import { MarketAddress, MarketAddressAbi } from './constants';

const pinataApiKey = 'bbdad6e8f367f08322f5';
const pinataSecretApiKey =
    '369dda1f1e32d4c3655683ba2e8bcdd64a0044156cee410d328f610907fcf324';

const fetchContract = (signerOrProvider) =>
    new ethers.Contract(MarketAddress, MarketAddressAbi, signerOrProvider);

export const NFTContext = React.createContext();
export const NFTProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('');
    const nftCurrency = 'ETH';

    const [isLoadingNFT, setIsLoadingNFT] = useState(false);

    const checkIfWalletIsConnected = async () => {
        if (!window.ethereum) {
            return alert('Please install MetaMask');
        }

        const accounts = await window.ethereum.request({
            method: 'eth_accounts',
        });

        if (accounts.length) {
            setCurrentAccount(accounts[0]);
        } else {
            console.log(`No accounts found.`);
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            return alert('Please install MetaMask');
        }

        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
        });

        setCurrentAccount(accounts[0]);

        window.location.reload();
    };

    const uploadToPinata = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const resFile = await axios({
                method: 'post',
                url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
                data: formData,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    'Content-Type': 'multipart/form-data',
                },
            });

            const imgHash = resFile.data.IpfsHash;

            const imgUrl = `https://gateway.pinata.cloud/ipfs/${imgHash}`;
            return imgUrl;
        } catch (error) {
            console.error('Error uploading file to Pinata:', error);
            throw new Error('Unable to upload image to Pinata');
        }
    };

    const createNFT = async (formInput, fileUrl, router) => {
        const { name, description, price } = formInput;

        if (!name || !description || !price || !fileUrl) return;

        const data = JSON.stringify({
            name,
            description,
            image: fileUrl,
        });

        try {
            const formData = new FormData();
            formData.append(
                'file',
                new Blob([data], { type: 'application/json' }),
                'nft.json',
            );

            const resData = await axios({
                method: 'post',
                url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
                data: formData,
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                    'Content-Type': 'multipart/form-data',
                },
            });
            const jsonHash = resData.data.IpfsHash;
            const jsonUrl = `https://gateway.pinata.cloud/ipfs/${jsonHash}`;
            console.log('NFT metadata uploaded to IPFS at:', jsonUrl);

            await createSale(jsonUrl, price);
            router.push('/');
        } catch (error) {
            console.error('Error uploading JSON to Pinata:', error);
            throw new Error('Unable to upload NFT metadata to Pinata');
        }
    };

    const createSale = async (url, formInputPrice, isReselling, id) => {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const price = ethers.utils.parseUnits(formInputPrice, 'ether');
        const contract = fetchContract(signer);
        const listingPrice = await contract.getListingPrice();

        const transaction = !isReselling
            ? await contract.createToken(url, price, {
                  value: listingPrice.toString(),
              })
            : await contract.resellToken(id, price, {
                  value: listingPrice.toString(),
              });

        setIsLoadingNFT(true);
        await transaction.wait();
    };

    const fetchNFTs = async () => {
        setIsLoadingNFT(false);
        try {
            const provider = new ethers.providers.JsonRpcProvider();
            const contract = fetchContract(provider);

            const data = await contract.fetchMarketItems();

            const items = await Promise.all(
                data.map(
                    async ({
                        tokenId,
                        seller,
                        owner,
                        price: unformattedPrice,
                    }) => {
                        const tokenURI = await contract.tokenURI(tokenId);
                        const {
                            data: { image, name, description },
                        } = await axios.get(tokenURI);
                        const price = ethers.utils.formatUnits(
                            unformattedPrice.toString(),
                            'ether',
                        );

                        return {
                            price,
                            tokenId: tokenId.toNumber(),
                            seller,
                            owner,
                            image,
                            name,
                            description,
                            tokenURI,
                        };
                    },
                ),
            );

            return items;
        } catch (error) {
            console.error('Error fetching market items:', error);
        }
    };

    useEffect(() => {
        checkIfWalletIsConnected();
        // createSale('test', '0.01');
    }, []);

    const fetchMyNFTsOrListedNFTs = async (type) => {
        setIsLoadingNFT(false);

        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = fetchContract(signer);

        const data =
            type === 'fetchItemsListed'
                ? await contract.fetchItemsListed()
                : await contract.fetchMyNFTs();

        const items = await Promise.all(
            data.map(
                async ({ tokenId, seller, owner, price: unformattedPrice }) => {
                    const tokenURI = await contract.tokenURI(tokenId);
                    const {
                        data: { image, name, description },
                    } = await axios.get(tokenURI);
                    const price = ethers.utils.formatUnits(
                        unformattedPrice.toString(),
                        'ether',
                    );

                    return {
                        price,
                        tokenId: tokenId.toNumber(),
                        seller,
                        owner,
                        image,
                        name,
                        description,
                        tokenURI,
                    };
                },
            ),
        );

        return items;
    };

    const buyNFT = async (nft) => {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = fetchContract(signer);

        const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

        const transaction = await contract.createMarketSale(nft.tokenId, {
            value: price,
        });

        setIsLoadingNFT(true);

        await transaction.wait();

        setIsLoadingNFT(false);
    };

    return (
        <NFTContext.Provider
            value={{
                nftCurrency,
                connectWallet,
                currentAccount,
                uploadToPinata,
                createNFT,
                fetchNFTs,
                fetchMyNFTsOrListedNFTs,
                buyNFT,
                createSale,
                isLoadingNFT,
            }}
        >
            {children}
        </NFTContext.Provider>
    );
};
