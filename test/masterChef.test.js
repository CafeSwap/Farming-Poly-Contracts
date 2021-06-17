const { expectRevert, time } = require('@openzeppelin/test-helpers');
const masterChefV2 = artifacts.require('MasterChefV2');

const CoffeeToken = artifacts.require('CoffeeToken');
const Mocktoken = artifacts.require('MockERC20');

const addressZero = '0x0000000000000000000000000000000000000000';

contract('masterChefv2', ([alice, bob, carol, dev, minter]) => {

    context('masterChef test', () => {
        beforeEach(async () => {

            this.brew = await CoffeeToken.new('1000000000000000000000000000', { from: minter });
            
            this.lp1 = await Mocktoken.new({from: minter});
            this.lp2 = await Mocktoken.new({from: minter});

            await this.lp1.mint(alice, web3.utils.toWei('50'),{from: minter})
            await this.lp1.mint(bob, web3.utils.toWei('50'),{from: minter})
            await this.lp1.mint(carol, web3.utils.toWei('50'),{from: minter})

            await this.lp2.mint(alice, web3.utils.toWei('50'),{from: minter})
            await this.lp2.mint(bob, web3.utils.toWei('50'),{from: minter})
            await this.lp2.mint(carol, web3.utils.toWei('50'),{from: minter})         
        });

        it('should give out brews only after farming time', async () => {
            // 1000 per block farming rate starting at block 100 

            this.masterChef = await masterChefV2.new(
                this.brew.address,
                minter,
                minter,
                '1000',
                '100',
                { from: minter }
            );

            await this.brew.addMinter(this.masterChef.address, {from: minter})

            await this.masterChef.add('100', this.lp1.address, 0,true,{from: minter});
            await this.lp1.approve(this.masterChef.address, '1000', { from: bob });
            await this.masterChef.deposit(0, '100', { from: bob });
            await time.advanceBlockTo('89');
            
            await this.masterChef.deposit(0, '0', { from: bob }); // block 90
            assert.equal((await this.brew.balanceOf(bob)).valueOf(), '0');
            
            await time.advanceBlockTo('94');
            await this.masterChef.deposit(0, '0', { from: bob }); // block 95
            assert.equal((await this.brew.balanceOf(bob)).valueOf(), '0');
            
            await time.advanceBlockTo('99');
            await this.masterChef.deposit(0, '0', { from: bob }); // block 100
            assert.equal((await this.brew.balanceOf(bob)).valueOf(), '0');
            
            await time.advanceBlockTo('100');
            await this.masterChef.deposit(0, '0', { from: bob }); // block 101
            // 1000/10 = 100 To Dev, 1000-100 = 900 to Bob
            console.log(web3.utils.fromWei(await this.brew.balanceOf(bob)));
            console.log(web3.utils.fromWei(await this.brew.balanceOf(minter)));
            console.log(web3.utils.fromWei(await this.brew.totalSupply()));

            assert.equal((await this.brew.balanceOf(bob)).valueOf(), '900');
            assert.equal((await this.brew.balanceOf(minter)).valueOf(), '100');
            assert.equal((await this.brew.totalSupply()).valueOf(), '1000');
            await time.advanceBlockTo('104');
            await this.masterChef.deposit(0, '0', { from: bob }); // block 105
            // 4000/10 = 400 to Dev, 4000-400 = 3600
            // 400 + 100 to Dev = 500, 3600+900 to Bob = 4500
            // Total supply is at 5000
            assert.equal((await this.brew.balanceOf(minter)).valueOf(), '500');
            assert.equal((await this.brew.balanceOf(bob)).valueOf(), '4500');
            assert.equal((await this.brew.totalSupply()).valueOf(), '5000');
        });

        it('should not allow the minting of brew if minter is not set', async () => {
          // 1000 per block farming rate starting at block 100 

          this.masterChef = await masterChefV2.new(
              this.brew.address,
              minter,
              minter,
              '1000',
              '200',
              { from: minter }
          );

          await this.masterChef.add('100', this.lp1.address, 0,true,{from: minter});
          await this.lp1.approve(this.masterChef.address, '1000', { from: bob });
          await this.masterChef.deposit(0, '100', { from: bob });
          await time.advanceBlockTo('189');
          
          await time.advanceBlockTo('200');
          await expectRevert(this.masterChef.deposit(0, '0', { from: bob }), '!governance && !minter');
          // 1000/10 = 100 To Dev, 1000-100 = 900 to Bob
          console.log(web3.utils.fromWei(await this.brew.balanceOf(bob)));
          console.log(web3.utils.fromWei(await this.brew.balanceOf(minter)));
          console.log(web3.utils.fromWei(await this.brew.totalSupply()));

          assert.equal((await this.brew.balanceOf(bob)).valueOf(), '0');
          assert.equal((await this.brew.balanceOf(minter)).valueOf(), '0');
          assert.equal((await this.brew.totalSupply()).valueOf(), '0');
      });

    });
});
