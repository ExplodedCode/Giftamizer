import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:giftamizer/app.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../main.dart';

class GroupsMenu extends StatelessWidget {
  const GroupsMenu({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Navigator(
        key: productsKey,
        initialRoute: '/',
        onGenerateRoute: (RouteSettings settings) {
          WidgetBuilder builder;
          switch (settings.name) {
            case '/':
              builder = (BuildContext _) => const GroupsList();
              break;
            case GroupPage.route:
              builder = (BuildContext _) {
                return GroupPage(
                  group: settings.arguments,
                );
              };
              break;
            case MemeberItems.route:
              builder = (BuildContext _) {
                return MemeberItems(
                  arguments: settings.arguments,
                );
              };
              break;
            default:
              builder = (BuildContext _) => const GroupsList();
          }
          return MaterialPageRoute(builder: builder, settings: settings);
        });
  }
}

class GroupsList extends StatefulWidget {
  const GroupsList({Key? key}) : super(key: key);
  static const String route = '/';

  @override
  State<GroupsList> createState() => _GroupsListState();
}

class _GroupsListState extends State<GroupsList> {
  final _scrollController = ScrollController();

  var _loading = true;
  var groups = [];

  var refreshKey = GlobalKey<RefreshIndicatorState>();

  Future<void> _getGroups() async {
    refreshKey.currentState?.show(atTop: false);

    setState(() {
      _loading = true;
    });

    try {
      final userID = supabase.auth.currentUser!.id;

      groups = await supabase.from('groups').select('''id,
					name,
					image_token,
					my_membership:group_members!inner(*)''').eq('my_membership.user_id', userID);
    } on PostgrestException catch (error) {
      SnackBar(
        content: Text(error.message),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } catch (error) {
      SnackBar(
        content: const Text('Unexpected error occurred'),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _getGroups();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text('Groups'),
        ),
        body: RefreshIndicator(
          key: refreshKey,
          onRefresh: _getGroups,
          child: ListView.builder(
              itemCount: groups.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: InkWell(
                      onTap: () {
                        NavbarNotifier().hideBottomNavBar = false;
                        navigate(context, GroupPage.route,
                            isRootNavigator: false, arguments: groups[index]);
                      },
                      child: GroupCard(group: groups[index])),
                );
              }),
        ));
  }
}

class GroupCard extends StatelessWidget {
  const GroupCard({Key? key, required this.group}) : super(key: key);
  final dynamic group;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          if (group['image_token'] != null)
            Center(
              child: Stack(
                children: <Widget>[
                  Image.network(
                    'https://giftamizer.com//storage/v1/object/public/groups/${group['id']}?${group['image_token']}',
                    width: double.infinity,
                    height: MediaQuery.of(context).size.width * 0.65,
                    fit: BoxFit.cover,
                  ),
                ],
              ),
            )
          else
            Container(
              width: double.infinity,
              height: MediaQuery.of(context).size.width * 0.65,
              color: Colors.green,
              child: Center(
                child: Text(
                  group['name'].toString()[0],
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 225,
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
                width: double.infinity,
                child: Text(group['name'],
                    style: const TextStyle(
                      fontSize: 25,
                    ),
                    textAlign: TextAlign.left)),
          ),
        ],
      ),
    );
  }
}

class GroupPage extends StatefulWidget {
  const GroupPage({Key? key, this.group}) : super(key: key);
  static const String route = '/groups/detail';
  final dynamic group;

  @override
  State<GroupPage> createState() => _GroupPageState();
}

class _GroupPageState extends State<GroupPage> {
  final _scrollController = ScrollController();

  var _loading = true;
  var members = [];

  Future<void> _getGroupMembers() async {
    setState(() {
      _loading = true;
    });

    try {
      final userID = supabase.auth.currentUser!.id;
      members = await supabase.from('group_members').select('''user_id,
					owner,
					invite,
					profile:profiles(
							email,
							first_name,
							last_name,
							bio,
							avatar_token
						)
					)
					''').neq('user_id', userID).eq('group_id', widget.group['id']);

      var listMembers = await supabase
          .from('lists')
          .select('''*,
					lists_groups!inner(
						group_id
					),
					profile:profiles(
						first_name,
						last_name
					)
					''')
          .eq('lists_groups.group_id', widget.group['id'])
          .eq('child_list', true);

      for (var l in listMembers) {
        members.add({
          'user_id': '${l.user_id}_${l.id}',
          'owner': false,
          'invite': false,
          'profile': {
            'first_name': l.name,
            'last_name': '',
            'email': '${l.profile.first_name} ${l.profile.last_name}',
            'bio': l.bio,
            'avatar_token': l.avatar_token,
          },
          'child_list': true,
        });
      }
    } on PostgrestException catch (error) {
      SnackBar(
        content: Text(error.message),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } catch (error) {
      SnackBar(
        content: const Text('Unexpected error occurred'),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _getGroupMembers();
    _addScrollListener();
  }

  void _addScrollListener() {
    _scrollController.addListener(() {
      if (_scrollController.position.userScrollDirection ==
          ScrollDirection.forward) {
        if (NavbarNotifier().hideBottomNavBar) {
          NavbarNotifier().hideBottomNavBar = false;
        }
      } else {
        if (!NavbarNotifier().hideBottomNavBar) {
          NavbarNotifier().hideBottomNavBar = true;
        }
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Group: ${widget.group['name']}'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(
              Icons.settings,
              color: Colors.white,
            ),
            onPressed: () {
              // do something
            },
          )
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : members.isNotEmpty
              ? ListView.builder(
                  controller: _scrollController,
                  itemCount: members.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: InkWell(
                          onTap: () {
                            NavbarNotifier().hideBottomNavBar = false;
                            navigate(context, MemeberItems.route,
                                isRootNavigator: false,
                                arguments: {
                                  'group': widget.group,
                                  'member': members[index]
                                });
                          },
                          child: MemberCard(member: members[index])),
                    );
                  })
              : const Center(
                  child: Text(
                      "This group has no members, invite some friends and family!"),
                ),
    );
  }
}

class MemberCard extends StatelessWidget {
  const MemberCard({Key? key, required this.member}) : super(key: key);
  final dynamic member;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          if (member['profile']['avatar_token'] != null)
            Center(
              child: Stack(
                children: <Widget>[
                  Image.network(
                    'https://giftamizer.com//storage/v1/object/public/avatars/${member['user_id']}?${member['profile']['avatar_token']}',
                    width: double.infinity,
                    height: MediaQuery.of(context).size.width * 0.65,
                    fit: BoxFit.cover,
                  ),
                ],
              ),
            )
          else
            Container(
              width: double.infinity,
              height: MediaQuery.of(context).size.width * 0.65,
              color: Colors.green,
              child: Center(
                child: Text(
                  member['profile']['first_name'].toString()[0],
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 225,
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
                width: double.infinity,
                child: Text(
                    '${member['profile']['first_name']} ${member['profile']['last_name']}',
                    style: const TextStyle(
                      fontSize: 25,
                    ),
                    textAlign: TextAlign.left)),
          ),
        ],
      ),
    );
  }
}

class MemeberItems extends StatelessWidget {
  final dynamic arguments;
  const MemeberItems({Key? key, this.arguments}) : super(key: key);
  static const String route = '/groups/detail/users';
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
            '${arguments['group']['name']}: ${arguments['member']['profile']['first_name']} ${arguments['member']['profile']['last_name']}'),
      ),
      body: ListView.builder(itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.all(8.0),
          child: SizedBox(
            height: 60,
            child: ListTile(
              tileColor: Colors.grey.withOpacity(0.5),
              title: Text('Items $index'),
            ),
          ),
        );
      }),
    );
  }
}
