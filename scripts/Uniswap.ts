import { ethers, network } from "hardhat";

async function main() {
  const uniswapAddr = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const to = "0x20bB82F2Db6FF52b42c60cE79cDE4C7094Ce133F"; //liquidityProviderAddress
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const deadline = currentTimestampInSeconds + 86400;
  const amountTokenDesired = ethers.parseEther("20");
  const amountApp = ethers.parseEther("500");
  const ETHpassed = ethers.parseEther("0.2");
  const amountTokenMin = ethers.parseEther("0");
  const amountETHMin = ethers.parseEther("0");
  const uniswapFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";//same as uniswap.factory used in line 20
  const LiquidProv = "0x20bB82F2Db6FF52b42c60cE79cDE4C7094Ce133F";

  const uniswap = await ethers.getContractAt("IUniswap", uniswapAddr);
  const UniContract = await ethers.getContractAt("IERC20", UNI);
  const uniswapV2 = await ethers.getContractAt(
    "IUniswapV2Factory",
    await uniswap.factory()
  );

  //SET BALANCE for UniHolder
  await network.provider.send("hardhat_setBalance", [
    LiquidProv,
    "0x3F1BDF10116048A59340000000",
  ]);

  //Impersonate the addresses
  const signer = await ethers.getImpersonatedSigner(LiquidProv);

  await UniContract.connect(signer).approve(uniswap, amountApp);
  const balbefore = await UniContract.balanceOf(LiquidProv);
  console.log(`Balance before adding liquidity is ${balbefore}`);

  const bal = await uniswap
    .connect(signer)
    .addLiquidityETH(
      UNI,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      { value: ETHpassed }
    );

  //console.log(bal);

  const balAfter = await UniContract.balanceOf(LiquidProv);
  console.log(`Balance after adding liquidity is ${balAfter}`);
  const pair = await uniswapV2.connect(signer).getPair(WETH, UNI);
  //console.log(pair);  //pair address ==> 0xd3d2E2692501A5c9Ca623199D38826e513033a17
 
  const Liquidity = await ethers.getContractAt("IERC20", pair);
  const liquidBal = await Liquidity.balanceOf(LiquidProv);

  console.log(`Liquidity balance is ${await ethers.formatEther(liquidBal)}`);

  const withdrawLiquid = await uniswap
    .connect(signer)
    .removeLiquidityETH(
      UNI,
      liquidBal,
      amountTokenMin,
      amountETHMin,
      to,
      deadline
    );
  await withdrawLiquid.wait();
  console.log(withdrawLiquid);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
