// pages/list/list.js

import { request } from '../../lib/request.js';
import { showToast } from '../../utils/promise.js';

/**
 * @typedef Gift
 * @type {Object}
 * @property {Number} id - 礼物id
 * @property {String} title - 礼物名称
 * @property {String} tag - 礼物标签
 * @property {String} url - 礼物图片链接
 * @property {Number} boylike - 礼物男性喜爱人数
 * @property {Number} girllike - 礼物女性喜爱人数
 * @property {Number} price - 礼物价格
 * @property {String} des - 礼物描述
 * @property {Number} progress - 礼物喜爱人数比例
 */

Page({

  data: {
    /**
     * 渲染爱好下拉框所用
     * @type {string[]}
     */
    habitChoice: ["运动", "读书", "旅行", "美食", "收藏", "艺术", "桌游", "网游", "智力游戏", "学习", "美丽", "帅气"],

    /**
     * 礼物信息
     * @type {Gift[]}
     */
    giftInfo: [],

    /**
     * 记录选择赠送礼物对象的身份
     * 仅可单选  默认0   0.1.2
     * @type {number}
     */
    chooseSituation: 0,

    /**
     * 记录选择的性别
     * 仅可单选  默认-1 0男性 1女性
     * @type {number}
     */
    chooseSex: -1,

    /**
     * 记录选择的爱好
     * 仅可单选  默认-1 下标自0起始
     * @type {number}
     */
    chooseHabit: -1,

    /**
     * 是否隐藏 habbit 下拉框
     * @type {boolean}
     */
    isHabbitHide: true,

    /**
     * 是否隐藏 sex 下拉框
     * @type {boolean}
     */
    isSexHide: true,
  },

  /**
   * openid
   * @type {string}
   */
  openid: '',

  /**
   * 记录礼物完整信息
   * @type {Gift}
   */
  giftRankAll: [],

  /**
   * 记录已加载的礼物数量
   * @type {number}
   */
  giftNumber: 0,

  /**
   * 保存下拉框恢复的计时器
   * @type {NodeJS.Timeout}
   */
  timekeeper: null,

  onLoad: async function () {
    const openid = wx.getStorageSync('openid');
    this.openid = openid ? openid : '';

    const gender = wx.getStorageSync('gender');
    this.setData({
      chooseSex: gender ? gender : 0,
    });

    await this.getGiftList();
    await this.setGiftList();
  },

  onReachBottom: function () {
    if(this.giftNumber !== 50)
      this.setGiftList();
  },
 
  /**
   * @function
   * @async
   * @description 请求获取礼物并保存
   * @returns {Promise<void>}
   */
  async getGiftList () {
    // 获取各参数
    const {chooseSituation, chooseSex, chooseHabit, habitChoice} = this.data;
    const openid = this.openid;

    // 提取tags各参数值
    const situation = ["热恋期", "初恋期", "追求期"][chooseSituation];
    const sex = chooseSex === 1 ? '女' : '男';
    const choice = chooseHabit >= 0 ? habitChoice[chooseHabit] : null;

    try {

      // 请求礼物信息
      const {data} = await request({
        url: '/gift/gift/getTopByTag',
        method: 'POST',
        data: {
          openid,
          sex,
          tags: [
            sex,
            situation,
            choice ?? '',
          ],
        },
        header: {
          'Content-Type': 'application/json',
        },
      });

      // 存储礼物信息同时进行排序
      this.giftRankAll = data.data?.['gift_rank:'].filter(v => v).sort((a, b) => (b?.boylike ?? 0 + b?.girllike ?? 0) - (a?.boylike ?? 0 + a?.girllike ?? 0));

    } catch (err) {
      console.info(err);
      showToast({
        title: '网络异常',
        icon: 'error',
      });
    }
    
  },

  /**
   * @function
   * @async
   * @description 加载及处理礼物
   * @param {boolean} flag 标记是否需重置giftInfo
   * @returns {Promise<void>}
   */
  async setGiftList (flag = false) {
    if(flag) {
      this.giftNumber = 0;
    }

    // 获取礼物下标
    const start = this.giftNumber;
    const end = (this.giftNumber + 6) <= 50 ? (this.giftNumber + 6) : 50;

    // 提取礼物信息
    const giftInfo = [...(flag ? [] : this.data.giftInfo), ...this.giftRankAll?.slice(start, end)];

    // 更新礼物信息并记录现在已渲染的礼物数量
    this.setData({
      giftInfo,
    });
    this.giftNumber = end;
  },

  /**
   * @function
   * @async
   * @description 身份情况选择
   * @param {Event} e 事件回调函数参数
   * @returns {Promise<void>}
   */
  async handleOnChooseSituation (e) {
    
    const {id} = e.target.dataset;
    let {chooseSituation} = this.data;
    chooseSituation = id ?? 0;
    this.setData({
      chooseSituation,
    });
    
  },

  /**
   * @function
   * @async
   * @description 下拉框响应
   * @param {Event} e 事件回调函数参数
   * @returns {Promise<void>}
   */
  async handleSelect (e) {
    const CONTINUE_TIME = 5000;

    /*** 代表点击的是性别与爱好按钮：type是0代表性别，type是1代表爱好 ***/
    // * 处理下拉框显示与否
    const {type} = e.mark;
    const {isHabbitHide, isSexHide} = this.data;

    // 性别下拉框
    if(type === 0) {

      // 重置关闭下拉框计时器
      this.timekeeper !== null ? clearTimeout(this.timekeeper) : null;
      if(isSexHide) {
        this.timekeeper = setTimeout(() => {
          this.timekeeper = null;
          this.setData({
            isSexHide: true,
          });
        }, CONTINUE_TIME);
      }

      // 设置：重置sex下拉框状态；关闭habbit下拉框
      this.setData({
        isSexHide: !isSexHide,
        isHabbitHide: true,
      });

    } else if (type === 1) {    // 爱好下拉框

      this.timekeeper !== null ? clearTimeout(this.timekeeper) : null;
      if(isHabbitHide) {
        this.timekeeper = setTimeout(() => {
          this.timekeeper = null;
          this.setData({
            isHabbitHide: true,
          });
        }, CONTINUE_TIME);
      }
      this.setData({
        isHabbitHide: !isHabbitHide,
        isSexHide: true,
      });

    }

    /*** 代表点击的是具体选项：id是逻辑值为性别；id是数值为爱好 ***/
    const {id} = e.target.dataset;

    if(typeof id === 'boolean') {    // 开启的是性别下拉框

      // 取消计时器
      this.timekeeper !== null ? clearTimeout(this.timekeeper) : null;

      // 当将开启下拉框时设定计时器：3s后无点击则关闭下拉框
      this.timekeeper = setTimeout(() => {
        this.timekeeper = null;
        this.setData({
          isSexHide: true,
        });
      }, CONTINUE_TIME);

      // 设置性别信息
      this.setData({
        chooseSex: id ? 1 : 0,
      });

    } else if(typeof id === 'number') {

      this.timekeeper !== null ? clearTimeout(this.timekeeper) : null;

      this.timekeeper = setTimeout(() => {
        this.timekeeper = null;
        this.setData({
          isHabbitHide: true,
        });
      }, CONTINUE_TIME);

      this.setData({
        chooseHabit: id,
      });

    }

  },

  /**
   * @function
   * @async
   * @description 更新礼物信息
   * @returns {Promise<void>}
   */
  async handleConfirm() {
    wx.showLoading({
      title: '加载中',
    });

    try {
      await this.getGiftList(true);
      await this.setGiftList(true);
    } catch (err) {
      console.log(err);
    }

    wx.hideLoading();

    this.setData({
      isHabbitHide: true,
      isSexHide: true,
    });
  },

});
