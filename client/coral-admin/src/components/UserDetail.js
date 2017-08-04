import React, {PropTypes} from 'react';
import Comment from './UserDetailComment';
import styles from './UserDetail.css';
import {Button, Drawer, Spinner} from 'coral-ui';
import {Slot} from 'coral-framework/components';
import ButtonCopyToClipboard from './ButtonCopyToClipboard';
import {actionsMap} from '../utils/moderationQueueActionsMap';
import ClickOutside from 'coral-framework/components/ClickOutside';
import LoadMore from '../components/LoadMore';

export default class UserDetail extends React.Component {

  static propTypes = {
    userId: PropTypes.string.isRequired,
    hideUserDetail: PropTypes.func.isRequired,
    root: PropTypes.object.isRequired,
    bannedWords: PropTypes.array.isRequired,
    suspectWords: PropTypes.array.isRequired,
    acceptComment: PropTypes.func.isRequired,
    rejectComment: PropTypes.func.isRequired,
    changeStatus: PropTypes.func.isRequired,
    toggleSelect: PropTypes.func.isRequired,
    bulkAccept: PropTypes.func.isRequired,
    bulkReject: PropTypes.func.isRequired,
  }

  rejectThenReload = (info) => {
    this.props.rejectComment(info).then(() => {
      this.props.data.refetch();
    });
  }

  acceptThenReload = (info) => {
    this.props.acceptComment(info).then(() => {
      this.props.data.refetch();
    });
  }

  showAll = () => {
    this.props.changeStatus('all');
  }

  showRejected = () => {
    this.props.changeStatus('rejected');
  }

  renderLoading() {
    return (
      <ClickOutside onClickOutside={this.props.hideUserDetail}>
        <Drawer onClose={this.props.hideUserDetail}>
          <Spinner />
        </Drawer>
      </ClickOutside>
    );
  }

  renderLoaded() {
    const {
      root: {
        user,
        totalComments,
        rejectedComments,
        comments: {nodes, hasNextPage}
      },
      activeTab,
      selectedCommentIds,
      bannedWords,
      suspectWords,
      toggleSelect,
      bulkAccept,
      bulkReject,
      hideUserDetail,
      viewUserDetail,
      loadMore,
    } = this.props;

    const localProfile = user.profiles.find((p) => p.provider === 'local');

    let profile;
    if (localProfile) {
      profile = localProfile.id;
    }

    let rejectedPercent = (rejectedComments / totalComments) * 100;
    if (rejectedPercent === Infinity || isNaN(rejectedPercent)) {

      // if totalComments is 0, you're dividing by zero, which is naughty
      rejectedPercent = 0;
    }

    return (
      <ClickOutside onClickOutside={hideUserDetail}>
        <Drawer onClose={hideUserDetail}>
          <h3>{user.username}</h3>

          <div>
            {profile && <input className={styles.profileEmail} readOnly type="text" ref={(ref) => this.profile = ref} value={profile} />}
            <ButtonCopyToClipboard className={styles.copyButton} copyText={profile} />
          </div>

          <Slot
            fill="userProfile"
            data={this.props.data}
            root={this.props.root}
            user={user}
          />
          <p className={styles.memberSince}><strong>Member since</strong> {new Date(user.created_at).toLocaleString()}</p>
          <hr/>
          <p>
            <strong>Account summary</strong>
            <br/><small className={styles.small}>Data represents the last six months of activity</small>
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <p>Total Comments</p>
              <p>{totalComments}</p>
            </div>
            <div className={styles.stat}>
              <p>Reject Rate</p>
              <p>{`${(rejectedPercent).toFixed(1)}%`}</p>
            </div>
          </div>
          {
            selectedCommentIds.length === 0
            ? (
              <ul className={styles.commentStatuses}>
                <li className={activeTab === 'all' ? styles.active : ''} onClick={this.showAll}>All</li>
                <li className={activeTab === 'rejected' ? styles.active : ''} onClick={this.showRejected}>Rejected</li>
              </ul>
            )
            : (
              <div className={styles.bulkActionGroup}>
                <Button
                  onClick={bulkAccept}
                  className={styles.bulkAction}
                  cStyle='approve'
                  icon='done'>
                </Button>
                <Button
                  onClick={bulkReject}
                  className={styles.bulkAction}
                  cStyle='reject'
                  icon='close'>
                </Button>
                {`${selectedCommentIds.length} comments selected`}
              </div>
            )
          }

          <div>
            {
              nodes.map((comment) => {
                const status = comment.action_summaries ? 'FLAGGED' : comment.status;
                const selected = selectedCommentIds.indexOf(comment.id) !== -1;
                return <Comment
                  key={comment.id}
                  user={user}
                  comment={comment}
                  selected={false}
                  suspectWords={suspectWords}
                  bannedWords={bannedWords}
                  actions={actionsMap[status]}
                  acceptComment={this.acceptThenReload}
                  rejectComment={this.rejectThenReload}
                  selected={selected}
                  toggleSelect={toggleSelect}
                  viewUserDetail={viewUserDetail}
                />;
              })
            }
          </div>
          <LoadMore
            className={styles.loadMore}
            loadMore={loadMore}
            showLoadMore={hasNextPage}
            />
        </Drawer>
      </ClickOutside>
    );
  }

  render () {
    if (this.props.loading) {
      return this.renderLoading();
    }
    return this.renderLoaded();
  }
}
